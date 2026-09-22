/**
 * SahajCloud query functions for the PayloadCMS REST API.
 *
 * Each function gets its config (apiKey, baseURL) from the request context.
 * Callers do not pass these values.
 *
 * ## Caching
 *
 * None here. A subrequest to `cloud.sydevelopers.com` is a read through
 * that zone's Cloudflare cache, which SahajCloud purges by `Cache-Tag` on
 * every write. That is the only cache these reads have, and the only one
 * an editor's save can reach (#98).
 *
 * ## Error handling
 *
 * Errors propagate so error-utils.ts can retry them:
 * - Single-item queries (getPageBySlug, getDocumentById) return null for an
 *   empty result, then let errors propagate.
 * - The global query (getWebConfig) lets errors propagate. The SDK throws a
 *   PayloadSDKError carrying the status, so error-utils.ts classifies it.
 * - List queries (getPagesByTags, getSongsByTags) return an empty array for
 *   an empty result, then let errors propagate.
 *
 * error-utils.ts classifies by HTTP status where the error carries one, and
 * falls back to message patterns for errors that do not (a network TypeError).
 */

import { createPayloadClient } from './payload-client'
import { withRetry } from './error-utils'
import { sahajCloudFetchOptional } from './sahajcloud-fetch'
import { resolveLecture, type ResolvedLecture } from '../lib/lecture-shape'
import * as Sentry from '@sentry/react'
import type {
  Config,
  PagesSelect,
  MeditationsSelect,
  LecturesSelect,
  SongsSelect,
  AlbumsSelect,
  AppCardsSelect,
  FormsSelect,
  SongTagsSelect,
  ImagesSelect,
  AuthorsSelect,
  VideosSelect,
  WmWebConfigSelect,
  Audience,
} from './payload-types'
import type {
  EmbeddedFormSelect,
  Locale,
  Page,
  PageStatus,
  Song,
  WebConfig,
  WebTranslations,
  PageListItem,
  MeditationSong,
  RelatedMeditationCard,
  RelatedLectureCard,
} from './content-types'
import { DEFAULT_LOCALE, isLocale, WEB_TRANSLATIONS_SELECT } from './content-types'

// --- Common Options Interfaces ---

interface LocalizedQueryOptions {
  locale: Locale
}

/**
 * A preview read skips the retry on purpose. An editor watching their own
 * edit needs the error now, not after about 7s of backoff.
 */
function withRetryUnlessPreview<T>(
  fetchFn: () => Promise<T>,
  options: { preview?: boolean } = {},
): Promise<T> {
  return options.preview === true ? fetchFn() : withRetry(fetchFn)
}

// ============================================================================
// Field selection (required by the SahajCloud API query-validation hook)
//
// The backend rejects a read that omits `select`. It also rejects depth > 1
// without `populate`. Each query below selects only the fields the frontend
// renders. Each select constant is typed against a generated *Select
// interface. This turns a SahajCloud schema change (pulled by `pnpm types:cms`)
// into a compile error here, instead of a silent 400 or a missing field at
// runtime.
//
// Upload note: to select an upload's `url`, also select `filename`.
// Otherwise PayloadCMS returns `url: null`.
// ============================================================================

/** Image fields needed wherever an Image relationship/upload is populated. */
const IMAGE_POPULATE = {
  images: {
    url: true,
    filename: true,
    alt: true,
    width: true,
    height: true,
  } satisfies ImagesSelect<true>,
}

/** Fields rendered for a full Page (PageTemplate): body, author byline,
 * featured video, SEO meta, plus slug/draft status. */
const PAGE_SELECT = {
  title: true,
  content: true,
  slug: true,
  createdAt: true,
  _status: true,
  author: true,
  featuredVideo: true,
  meta: { title: true, description: true, image: true },
} satisfies PagesSelect<true>

/**
 * The one field the `hreflang` read needs.
 *
 * Read with `locale: 'all'`, so `_status` comes back as a per-locale map
 * rather than one locale's value. `pages` opts into
 * `versions.drafts.localizeStatus` upstream (SahajCloud#718), which is what
 * makes that map exist.
 */
const PAGE_STATUS_SELECT = { _status: true } satisfies PagesSelect<true>

/** Author fields the byline renders (photo populates via `images` at depth 2). */
const AUTHOR_POPULATE = {
  name: true,
  title: true,
  slug: true,
  countryCode: true,
  yearsMeditating: true,
  photo: true,
} satisfies AuthorsSelect<true>

/** Video fields the VideoPlayer renders (thumbnail populates via `images`). */
const VIDEO_POPULATE = {
  hlsUrl: true,
  previewUrl: true,
  title: true,
  thumbnail: true,
  subtitles: true,
} satisfies VideosSelect<true>

// ----------------------------------------------------------------------------
// Narrow selects for documents embedded in a Page's `content` (showcase
// cards, subtle-system nodes, content-index lists). Each select omits the
// collection's `content` and other heavy fields. This keeps a depth-3 page
// read small. A collection missing from `populate` returns fully
// populated, including its own `content`, which would inflate the response.
// ----------------------------------------------------------------------------

/** Narrow page fields for pages embedded in another page's content. */
const EMBEDDED_PAGE_SELECT = {
  title: true,
  slug: true,
  meta: { image: true, description: true },
} satisfies PagesSelect<true>

/** Narrow meditation fields for showcase / content-index cards. */
const EMBEDDED_MEDITATION_SELECT = {
  title: true,
  thumbnail: true,
  durationMinutes: true,
} satisfies MeditationsSelect<true>

/** Narrow lecture fields. No public web route exists yet. Selected only to limit payload size. */
const EMBEDDED_LECTURE_SELECT = {
  title: true,
  thumbnail: true,
} satisfies LecturesSelect<true>

/** Narrow album fields for showcase cards (artwork thumbnail). */
const EMBEDDED_ALBUM_SELECT = {
  title: true,
  artwork: true,
} satisfies AlbumsSelect<true>

/** Minimal app-card fields. No public web route exists. Selected only to limit payload size. */
const EMBEDDED_APP_CARD_SELECT = {
  label: true,
} satisfies AppCardsSelect<true>

/**
 * A form embedded in page content, as `FormBuilder` renders and submits it.
 *
 * ⚠ **Narrow on purpose, not for payload size.** A collection absent from
 * `populate` comes back fully populated, and a form's `recipient` is a
 * relationship to `managers` — so omitting this entry serializes a manager's
 * record into the page's hydration payload. `actionType` is what the
 * submission's `type` comes from; who a message is delivered to is SahajCloud's
 * business and never the browser's.
 *
 * `EmbeddedFormSelect` is what ties this list to the `EmbeddedForm` type its
 * consumers read, so neither can lose a key without the other failing to
 * compile.
 */
const EMBEDDED_FORM_SELECT = {
  title: true,
  fields: true,
  submitButtonLabel: true,
  confirmationType: true,
  confirmationMessage: true,
  redirect: true,
  actionType: true,
} satisfies FormsSelect<true> & EmbeddedFormSelect

/**
 * Populate map for a full Page read (depth 3). The backend rejects a
 * depth > 1 read without `populate`. Each entry both enables a relationship
 * to populate and restricts it to the fields the frontend renders. Beyond
 * the author and video byline, this covers the collections referenced from
 * `content` blocks (showcase, subtle-system, image galleries), so they
 * resolve titles, slugs, and thumbnails instead of degrading.
 */
const PAGE_POPULATE = {
  images: IMAGE_POPULATE.images,
  authors: AUTHOR_POPULATE,
  videos: VIDEO_POPULATE,
  pages: EMBEDDED_PAGE_SELECT,
  meditations: EMBEDDED_MEDITATION_SELECT,
  lectures: EMBEDDED_LECTURE_SELECT,
  albums: EMBEDDED_ALBUM_SELECT,
  'app-cards': EMBEDDED_APP_CARD_SELECT,
  forms: EMBEDDED_FORM_SELECT,
}

/** Global config fields: `pages` relationships the layout + home page need, plus
 * `audiences` (the site's fixed audience set the lectures /for-audience feed uses). */
const WEB_CONFIG_SELECT = {
  availableLocales: true,
  homePage: true,
  featuredPages: true,
  featuredArticles: true,
  classPages: true,
  knowledgePages: true,
  infoPages: true,
  audiences: true,
} satisfies WmWebConfigSelect<true>

/**
 * Populates the global's page relationships at depth 2, with the fields the
 * layout (title and slug, for nav) and the home page (content and meta)
 * render. Required because the backend rejects a depth > 1 read without
 * `populate`.
 */
const WEB_CONFIG_POPULATE = {
  ...PAGE_POPULATE,
  pages: PAGE_SELECT,
}

/** Minimal fields for page list items (getPagesByTags → PageListItem). */
const PAGE_LIST_SELECT = {
  title: true,
  meta: { image: true },
} satisfies PagesSelect<true>

/** Fields rendered for a Meditation (MeditationTemplate) plus draft status. */
const MEDITATION_SELECT = {
  url: true,
  filename: true,
  title: true,
  durationMinutes: true,
  frames: true,
  thumbnail: true,
  _status: true,
} satisfies MeditationsSelect<true>

/**
 * Fields for a Lecture. `fullLecture` is selected so a clip can reach its
 * parent's `metadata`, the playback source. See LECTURE_POPULATE.
 */
const LECTURE_SELECT = {
  type: true,
  title: true,
  thumbnail: true,
  startTime: true,
  stopTime: true,
  subtitles: true,
  metadata: true,
  fullLecture: true,
} satisfies LecturesSelect<true>

/**
 * Populate map for a Lecture read at depth 2. `lectures: LECTURE_SELECT`
 * self-populates a clip's `fullLecture` relationship with the parent's
 * fields, most importantly `metadata`. This lets a clip resolve its HLS
 * URL, duration, and base subtitles. `images` populates the thumbnail
 * upload.
 */
const LECTURE_POPULATE = {
  images: IMAGE_POPULATE.images,
  lectures: LECTURE_SELECT,
}

/** Fields for songs (getSongsByTags returns full Song-ish data). */
const SONG_SELECT = {
  title: true,
  url: true,
  filename: true,
  album: true,
  tags: true,
} satisfies SongsSelect<true>

/** Populate shapes for song relationships (album → artwork image, song tags). */
const SONG_POPULATE = {
  albums: { title: true, artist: true, artwork: true } satisfies AlbumsSelect<true>,
  'song-tags': { title: true, slug: true } satisfies SongTagsSelect<true>,
  images: IMAGE_POPULATE.images,
}

/**
 * Configuration for collections that support findById queries.
 * Maps PayloadCMS collection slugs to the select/populate shapes required
 * by the backend query-validation hook.
 */
const COLLECTION_BY_ID_CONFIG = {
  pages: {
    select: PAGE_SELECT,
    populate: PAGE_POPULATE,
  },
  meditations: {
    select: MEDITATION_SELECT,
    populate: IMAGE_POPULATE,
  },
  lectures: {
    select: LECTURE_SELECT,
    populate: LECTURE_POPULATE,
  },
} as const

type FindByIdCollection = keyof typeof COLLECTION_BY_ID_CONFIG

/**
 * The depth every single-document read asks for, and the one live preview's
 * populate proxy has to repeat.
 *
 * Named rather than written twice because a third caller now depends on the
 * number: `/api/live-preview/populate` re-runs this read shape against the
 * unsaved document, and a proxy reading shallower than the render would drop
 * exactly the relationships an editor is watching.
 */
const DOCUMENT_READ_DEPTH = 3

/** True for a collection `documentReadArgs` can answer for. */
export function isDocumentCollection(value: string): value is FindByIdCollection {
  return Object.hasOwn(COLLECTION_BY_ID_CONFIG, value)
}

/**
 * The depth / select / populate one document read sends, for a caller that is
 * not `getDocumentById`.
 *
 * Only live preview's populate proxy is such a caller. SahajCloud rejects an
 * API-client read with no `select` (400) and a depth > 1 read with no
 * `populate` (400, both verified against production), so the round trip cannot
 * simply forward what Payload's SDK sends. It also PRUNES the answer to
 * `select`, so a shape that disagreed with the render would hand the template
 * a document missing the fields it renders.
 */
export function documentReadArgs(collection: FindByIdCollection): {
  depth: number
  select: Record<string, unknown>
  populate: Record<string, unknown>
} {
  const config = COLLECTION_BY_ID_CONFIG[collection]

  return {
    depth: DOCUMENT_READ_DEPTH,
    select: config.select,
    populate: config.populate,
  }
}

// --- Single Item Queries ---

/**
 * Retrieves a specific page by slug and locale.
 *
 * @param options - Query options
 * @param options.slug - The page slug to search for
 * @param options.locale - The locale to retrieve the page in
 * @returns The page data or null if not found
 */
export async function getPageBySlug(
  options: LocalizedQueryOptions & {
    slug: string
    preview?: boolean
    previewToken?: string
  },
): Promise<Page | null> {
  const isPreview = options.preview === true

  return withRetryUnlessPreview(
    async () => {
      const client = createPayloadClient({
        preview: isPreview,
        previewToken: options.previewToken,
      })

      const result = await client.find({
        collection: 'pages',
        where: {
          slug: { equals: options.slug },
        },
        locale: options.locale,
        // ⚠ Under `draft: true` Payload matches the DRAFT version's slug, so a
        // draft that renames its slug is reachable at its new URL — which is
        // exactly the URL SahajCloud's `buildPageWebPath` composes for the
        // panel. The two agreeing is not a coincidence; it is why the panel
        // and the site share one composer.
        draft: isPreview,
        limit: 1,
        // Depth 3 so relationships embedded in `content` blocks (showcase,
        // subtle-system) resolve their own thumbnails. The narrow
        // per-collection selects in PAGE_POPULATE keep this small.
        depth: DOCUMENT_READ_DEPTH,
        select: PAGE_SELECT,
        populate: PAGE_POPULATE,
      })

      if (!result?.docs?.length) {
        return null
      }

      const page = result.docs[0] as Page

      // Belt and braces for the public path: an API key cannot read drafts
      // without a live-preview credential, so this should be unreachable. Under
      // preview it is exactly what we asked for.
      if (!isPreview && page._status === 'draft') {
        return null
      }

      return page
    },
    { preview: isPreview },
  )
}

/**
 * One page's per-locale publish state, `{ en: 'published', de: 'draft' }`,
 * for `advertisedLocales` to turn into an `hreflang` cluster.
 *
 * A **second, locale-agnostic read** beside the content read, not a
 * replacement for it. `locale: 'all'` turns every localized field into a
 * `{ locale: value }` map, which every consumer of `Page` would have to
 * unpick; this read selects `_status` alone, so the content read keeps its
 * ordinary single-locale shape. It sends no locale, so every locale of a
 * page issues the same URL and shares one edge entry.
 *
 * Returns `{}` — never `null` — for a page that is missing or has no
 * status, so `advertisedLocales` has a map to walk either way.
 *
 * Degrades to `{}` on failure, after a single attempt. The page content is
 * already in hand by then, and retrying for seconds to decorate the head
 * would cost more than the decoration is worth.
 *
 * The one cast sits here, at the boundary where `locale: 'all'` is applied:
 * the generated `Page._status` spells the field as the plain string a
 * single-locale read returns, and this is the only read that asks for the
 * map. `advertisedLocales` keeps its own runtime guard regardless — the
 * sitemap hands it a `_status` straight off a generated document type, and
 * meditations and lectures really do return a string or nothing there.
 */
export async function getPageLocaleStatus(options: {
  slug: string
}): Promise<Partial<Record<Locale, PageStatus>>> {
  try {
    return await withRetry(
      async () => {
        const client = createPayloadClient()

        const result = await client.find({
          collection: 'pages',
          where: { slug: { equals: options.slug } },
          locale: 'all',
          limit: 1,
          depth: 0,
          select: PAGE_STATUS_SELECT,
        })

        return (result?.docs?.[0]?._status ?? {}) as Partial<Record<Locale, PageStatus>>
      },
      // The page content is already in hand when this read fails, so the
      // default 3-attempt backoff would stall TTFB to decorate a `<head>`.
      { maxAttempts: 1 },
    )
  } catch (error) {
    console.warn(`[getPageLocaleStatus] no cluster for "${options.slug}":`, error)
    Sentry.captureMessage('Per-locale publish state read failed; emitting no hreflang cluster', {
      level: 'warning',
      tags: { source: 'getPageLocaleStatus' },
      extra: { slug: options.slug },
    })

    return {}
  }
}

/**
 * Retrieves a document by ID from any configured collection.
 *
 * This is a generic function that handles pages, meditations, and any future
 * collection types that support findById queries. It supports preview mode
 * for trusted draft previews.
 *
 * @param options - Query options
 * @param options.collection - The PayloadCMS collection slug
 * @param options.id - The document ID to retrieve
 * @param options.locale - The locale to retrieve the document in
 * @param options.preview - If true, fetch draft data with trusted preview credentials
 * @returns The document data or null if not found
 */
export async function getDocumentById<C extends FindByIdCollection>(
  options: LocalizedQueryOptions & {
    collection: C
    id: string
    preview?: boolean
    previewToken?: string
  },
): Promise<Config['collections'][C] | null> {
  const config = COLLECTION_BY_ID_CONFIG[options.collection]
  const isPreview = options.preview === true

  return withRetryUnlessPreview(
    async () => {
      const client = createPayloadClient({
        preview: isPreview,
        previewToken: options.previewToken,
      })

      const found = await client.findByID({
        collection: options.collection,
        id: options.id,
        locale: options.locale,
        // Depth 3 to resolve relationships embedded in `content` blocks (see
        // getPageBySlug). The per-collection selects in PAGE_POPULATE bound this.
        depth: DOCUMENT_READ_DEPTH,
        draft: isPreview,
        // select/populate are validated per-collection at their definitions above
        // (PAGE_SELECT / MEDITATION_SELECT via `satisfies`). TypeScript cannot
        // correlate the union-typed config to the generic collection `C`. The
        // input is cast here. The response is re-typed to the concrete doc below.
        select: config.select as never,
        populate: config.populate as never,
      })

      const result = found as Config['collections'][C] | null

      if (!result) return null
      // Public requests must never render a draft. A collection with no
      // draft/version support (for example lectures) has no `_status` and
      // is always live. Filter only where the field actually exists.
      const status = (result as { _status?: string })._status

      if (!isPreview && status === 'draft') return null

      return result
    },
    { preview: isPreview },
  )
}

/**
 * Gets a lecture by ID and normalizes it into a flat `ResolvedLecture`.
 *
 * Full lectures and clips resolve to the same shape. A clip inherits its
 * playback source (HLS URL, duration, base subtitles, thumbnail fallback)
 * from its parent `fullLecture`, populated at depth 2 (see LECTURE_POPULATE).
 *
 * @param options.id - The lecture document ID
 * @param options.locale - The locale to retrieve the lecture in
 * @param options.preview - If true, fetch draft data
 * @returns The normalized lecture or null if not found
 */
export async function getLecture(
  options: LocalizedQueryOptions & {
    id: string
    preview?: boolean
    previewToken?: string
  },
): Promise<ResolvedLecture | null> {
  const lecture = await getDocumentById({ collection: 'lectures', ...options })

  if (!lecture) return null

  const resolved = resolveLecture(lecture)

  // A clip with no resolvable HLS source means its parent `fullLecture`
  // returned unpopulated (a bare id, believed unpublished or trashed), or has
  // not synced its Nirmala Vidya metadata. The template degrades to an error
  // state. Report the SahajCloud data gap to Sentry, per `server/AGENTS.md`, so
  // it stays visible.
  if (!options.preview && resolved.type === 'clip' && !resolved.hlsUrl) {
    console.warn(
      `[getLecture] clip ${resolved.id} has no resolvable HLS source (unpopulated or unsynced parent lecture)`,
    )
    Sentry.captureMessage('Lecture clip has an unresolved parent (no HLS source)', {
      level: 'warning',
      tags: { source: 'getLecture' },
      extra: { lectureId: resolved.id, locale: options.locale ?? null },
    })
  }

  return resolved
}

// --- Global Settings ---

/**
 * Splits a page-relationship array into published, linkable pages (populated
 * objects with a slug) and unresolved references. A relationship is
 * unresolved when it returns as a bare ID (believed unpublished or trashed:
 * a published page populates, an unpublished one returns as just its ID) or
 * as an object with no slug.
 */
export function partitionPublishedPages(pages: (number | Page)[] | null | undefined): {
  published: Page[]
  unresolved: string[]
} {
  const published: Page[] = []
  const unresolved: string[] = []

  for (const page of pages ?? []) {
    if (typeof page === 'object' && page && typeof page.slug === 'string' && page.slug.length > 0) {
      published.push(page)
    } else {
      unresolved.push(typeof page === 'object' && page ? `id:${page.id}(no-slug)` : `id:${page}`)
    }
  }

  return { published, unresolved }
}

/**
 * Gets the WebConfig (site configuration).
 *
 * This singleton global holds references to important pages across the
 * site: the home page, featured pages, class pages, and more.
 *
 * This function drops unresolved page references (believed unpublished), so
 * the layout never renders a dead `/undefined` link, and reports each drop
 * to Sentry so the underlying SahajCloud data gap stays visible.
 *
 * This global has no drafts, so there is no preview variant to read. It
 * carried a `preview` flag only to bypass a 24 h KV entry; the edge cache
 * that replaced it expires within 600s on its own, so an editor sees a nav
 * or home-page change without one. The upstream purge-on-write only
 * shortens that wait — see CACHING.md, it is best-effort.
 *
 * @returns The web configuration with populated page relationships
 */
export async function getWebConfig(options: { locale?: Locale } = {}): Promise<WebConfig> {
  return withRetryUnlessPreview(async () => {
    const client = createPayloadClient()

    const config = await client.findGlobal({
      slug: 'wm-web-config',
      depth: 2,
      locale: options.locale,
      select: WEB_CONFIG_SELECT,
      populate: WEB_CONFIG_POPULATE,
    })

    // Drop unresolved (believed-unpublished) page references, so the
    // layout never renders a dead `/undefined` link.
    const featured = partitionPublishedPages(config.featuredPages)
    const featuredArticles = partitionPublishedPages(config.featuredArticles)
    const classPages = partitionPublishedPages(config.classPages)
    const knowledgePages = partitionPublishedPages(config.knowledgePages)
    const infoPages = partitionPublishedPages(config.infoPages)

    const unresolved = [
      ...(typeof config.homePage === 'number' ? [`homePage id:${config.homePage}`] : []),
      ...featured.unresolved.map((u) => `featuredPages ${u}`),
      ...featuredArticles.unresolved.map((u) => `featuredArticles ${u}`),
      ...classPages.unresolved.map((u) => `classPages ${u}`),
      ...knowledgePages.unresolved.map((u) => `knowledgePages ${u}`),
      ...infoPages.unresolved.map((u) => `infoPages ${u}`),
    ]

    // Report the data gap to Sentry without breaking the page. A published
    // page populates. An unpublished one returns as a bare id.
    if (unresolved.length > 0) {
      console.warn(
        `[getWebConfig] ${unresolved.length} unpublished/unresolved page reference(s): ${unresolved.join(', ')}`,
      )
      Sentry.captureMessage('WebConfig references unpublished or unresolved pages', {
        level: 'warning',
        tags: { source: 'getWebConfig' },
        extra: { unresolved, locale: options.locale ?? null },
      })
    }

    // An unconfigured global offers English only. Never return an empty
    // set: `loadSiteContext` 404s any locale outside it, so an empty
    // array would 404 the whole site, English included.
    const availableLocales = (config.availableLocales ?? []).filter(isLocale)

    return {
      ...config,
      availableLocales: availableLocales.length > 0 ? availableLocales : [DEFAULT_LOCALE],
      featuredPages: featured.published,
      featuredArticles: featuredArticles.published,
      classPages: classPages.published,
      knowledgePages: knowledgePages.published,
      infoPages: infoPages.published,
    } as WebConfig
  })
}

/**
 * Gets the UI strings for a locale, from the `wm-web-translations` global.
 *
 * SahajCloud fills a blank or missing key from English on every API-client
 * read (SahajCloud #705), so the site does no merge of its own: what comes
 * back is already complete for the locale.
 *
 * Errors propagate; `loadSiteContext` degrades to the committed English
 * snapshot rather than failing the page.
 *
 * @param options.locale - The locale to retrieve strings in
 * @param options.preview - If true, fetch with preview credentials
 */
export async function getWebTranslations(options: {
  locale: Locale
  preview?: boolean
  previewToken?: string
}): Promise<WebTranslations> {
  const isPreview = options.preview === true

  return withRetryUnlessPreview(
    async () => {
      const client = createPayloadClient({
        preview: isPreview,
        previewToken: options.previewToken,
      })

      const translations = await client.findGlobal({
        slug: 'wm-web-translations',
        // The groups hold plain strings. Nothing to populate.
        depth: 0,
        locale: options.locale,
        // ⚠ Load-bearing, and it was missing: the header alone unlocks the
        // right to read a draft, it does not ASK for one. Without this a
        // translator previewing their own edit saw published copy, which is
        // the whole defect SahajCloud#776 was filed about.
        draft: isPreview,
        select: WEB_TRANSLATIONS_SELECT,
      })

      return translations as WebTranslations
    },
    { preview: isPreview },
  )
}

// --- List Queries (filtered by tags) ---

/**
 * Retrieves a list of pages filtered by tags (minimal data: id, title, thumbnail).
 *
 * @param options - Query options
 * @param options.tags - Array of tag values to filter by (e.g., 'wisdom', 'lifestyle', 'technique')
 * @param options.locale - The locale to retrieve pages in
 * @param options.limit - Maximum number of pages to return (default: 100)
 * @returns Array of page list items
 */
export async function getPagesByTags(
  options: LocalizedQueryOptions & {
    tags: string[]
    limit?: number
  },
): Promise<PageListItem[]> {
  const limit = options.limit || 100

  return withRetryUnlessPreview(async () => {
    const client = createPayloadClient()

    const result = await client.find({
      collection: 'pages',
      where: { tags: { in: options.tags } },
      locale: options.locale,
      limit,
      depth: 2,
      select: PAGE_LIST_SELECT,
      populate: IMAGE_POPULATE,
    })

    if (!result?.docs) return []

    return result.docs.map((page) => ({
      id: page.id,
      title: page.title ?? null,
      meta: page.meta ? { image: page.meta.image ?? null } : null,
    })) as PageListItem[]
  })
}

/**
 * Retrieves a list of songs filtered by tags (full song data).
 *
 * @param options - Query options
 * @param options.tagIds - Array of tag IDs to filter by
 * @param options.locale - The locale to retrieve songs in
 * @param options.limit - Maximum number of songs to return (default: 100)
 * @returns Array of song items
 */
export async function getSongsByTags(
  options: LocalizedQueryOptions & {
    tagIds: string[]
    limit?: number
  },
): Promise<Song[]> {
  const limit = options.limit || 100

  return withRetryUnlessPreview(async () => {
    const client = createPayloadClient()

    const result = await client.find({
      collection: 'songs',
      where: { tags: { in: options.tagIds } },
      locale: options.locale,
      limit,
      depth: 2,
      select: SONG_SELECT,
      populate: SONG_POPULATE,
    })

    if (!result?.docs) return []

    return result.docs as Song[]
  })
}

/**
 * Gets the background-music tracks eligible for a meditation, from the
 * custom nested route `GET /api/meditations/:id/songs`.
 *
 * Unlike the standard collection reads above, this endpoint does the
 * songTag and `includeForMeditations` selection on the server. It returns a
 * fixed minimal projection (`{ id, title, url, tags }`). It does not accept
 * `select`, and it ignores `populate`, `depth`, and `limit` (it does honor
 * `locale`). This is not a collection `find`, so the PayloadCMS SDK cannot
 * model it. This function instead reads through `sahajCloudFetchOptional`, wrapped
 * in the shared retry layer.
 *
 * The endpoint returns songs in a random order on every request. Callers
 * pick a track on the client, so a list held at the edge is fine. The
 * function returns an empty list when a meditation has no eligible songs
 * (HTTP 200, `{ docs: [] }`) and for an unknown ID (HTTP 404), so the player
 * simply renders voice-only.
 *
 * @param options.id - The meditation document ID
 * @param options.locale - The locale to retrieve songs in
 * @returns Playable music tracks (`{ id, title, url }`, url guaranteed non-empty)
 */
export async function getMeditationSongs(
  options: LocalizedQueryOptions & {
    id: string
  },
): Promise<MeditationSong[]> {
  try {
    return await withRetryUnlessPreview(async () => {
      // A 404 — an unknown meditation ID, or no songs route — means no music,
      // and arrives as `null`. Every other non-OK throws, so the retry runs.
      const body = await sahajCloudFetchOptional<{
        docs?: Array<{ id: number; title?: string | null; url?: string | null }>
      }>(
        `/api/meditations/${encodeURIComponent(options.id)}/songs` +
          `?locale=${encodeURIComponent(options.locale)}`,
        `getMeditationSongs(${options.id})`,
      )
      const docs = Array.isArray(body?.docs) ? body.docs : []

      // Keep only playable tracks. The player needs a real URL. The
      // endpoint omits duration, artwork, and credit, so title and url are
      // all this function returns.
      return docs
        .filter((doc) => typeof doc.url === 'string' && doc.url.length > 0)
        .map((doc) => ({ id: doc.id, title: doc.title ?? '', url: doc.url as string }))
    })
  } catch (error) {
    // Background music is supplementary. A failure to load it, even after
    // the retries, must never break the meditation page. Degrade to
    // voice-only and report the gap to Sentry.
    console.warn(
      `[getMeditationSongs] degrading to voice-only for meditation ${options.id}:`,
      error,
    )
    Sentry.captureMessage('getMeditationSongs failed; rendering meditation voice-only', {
      level: 'warning',
      tags: { source: 'getMeditationSongs' },
      extra: { meditationId: options.id, locale: options.locale ?? null },
    })

    return []
  }
}

/** Extracts audience document IDs (populated object or bare ID) as strings.
 * Shared with the content-index `/for-audience` lecture feed (server/content-index.ts). */
export function audienceIdList(audiences: (number | Audience)[] | null | undefined): string[] {
  if (!audiences) {
    return []
  }

  return audiences
    .map((a) => (typeof a === 'number' ? String(a) : a?.id != null ? String(a.id) : null))
    .filter((id): id is string => id !== null)
}

/**
 * Gets the meditations related to a lecture, from the shaped nested route
 * `GET /api/lectures/:id/related-meditations` (SahajCloud #523).
 *
 * Like `/songs`, this is not a collection `find`. The server does the
 * subtle-system-node-overlap ranking, with a recency-based top-up fallback,
 * and returns a fixed card projection. It ignores `select`, `populate`, and
 * `depth` (it does honor `locale` and `limit`). The SDK cannot model it, so
 * this function issues a raw authenticated fetch, wrapped in the shared
 * retry layer.
 *
 * The endpoint drops any card with no public title, duration, or thumbnail,
 * so the internal `label` never leaks. Meditation titles are not localized,
 * so the endpoint returns an empty list for a non-English locale. The
 * caller then renders no related section — this is graceful, not an error.
 * The function also returns `[]` for an unknown lecture ID (404), and for
 * any failure that survives retries.
 *
 * @param options.id - The lecture document ID (the anchor)
 * @param options.locale - The locale to retrieve meditation cards in
 * @param options.limit - Max cards to request (default 8)
 */
export async function getRelatedMeditations(
  options: LocalizedQueryOptions & {
    id: string
    limit?: number
  },
): Promise<RelatedMeditationCard[]> {
  const limit = options.limit ?? 8

  try {
    return await withRetryUnlessPreview(async () => {
      // A 404 — an unknown lecture ID, or no related route — means no related
      // content, and arrives as `null`.
      const body = await sahajCloudFetchOptional<{ docs?: Array<Record<string, unknown>> }>(
        `/api/lectures/${encodeURIComponent(options.id)}/related-meditations` +
          `?locale=${encodeURIComponent(options.locale)}&limit=${limit}`,
        `getRelatedMeditations(${options.id})`,
      )
      const docs = Array.isArray(body?.docs) ? body.docs : []

      // The endpoint already shapes cards. Still guard the rendered
      // fields, so a partial doc can never produce a blank card or a
      // broken thumbnail.
      return docs
        .filter(
          (doc): doc is Record<string, unknown> =>
            typeof doc.id === 'number' &&
            typeof doc.title === 'string' &&
            doc.title.length > 0 &&
            typeof doc.thumbnailUrl === 'string' &&
            doc.thumbnailUrl.length > 0,
        )
        .map((doc) => ({
          id: doc.id as number,
          title: doc.title as string,
          durationMinutes: typeof doc.durationMinutes === 'number' ? doc.durationMinutes : 0,
          thumbnailUrl: doc.thumbnailUrl as string,
          narratorName: typeof doc.narratorName === 'string' ? doc.narratorName : '',
        }))
    })
  } catch (error) {
    // Related content is supplementary. A failure to load it must never
    // break the lecture page. Degrade to no related section, and report the
    // failure to Sentry.
    console.warn(`[getRelatedMeditations] degrading to none for lecture ${options.id}:`, error)
    Sentry.captureMessage('getRelatedMeditations failed; rendering lecture without related', {
      level: 'warning',
      tags: { source: 'getRelatedMeditations' },
      extra: { lectureId: options.id, locale: options.locale ?? null },
    })

    return []
  }
}

/**
 * Gets the lectures related to a meditation, from the shaped nested route
 * `GET /api/meditations/:id/related-lectures` (the mirror of the endpoint
 * above). Unlike `/related-meditations`, this endpoint is audience-gated: it
 * requires the site's `audiences`, and 400s without them. With none
 * configured, this function returns `[]` immediately, instead of issuing a
 * request that would 400.
 *
 * The endpoint returns the full lecture player projection, ranked by node
 * overlap with an audience-and-recency fallback. This function returns only
 * the card subset: ID, title, thumbnail, and playable duration. It returns
 * `[]` for an unknown meditation ID (404), and for any failure that
 * survives retries.
 *
 * @param options.id - The meditation document ID (the anchor)
 * @param options.locale - The locale to retrieve lecture cards in
 * @param options.audiences - The site's fixed audiences (WebConfig.audiences)
 * @param options.limit - Max cards to request (default 8)
 */
export async function getRelatedLectures(
  options: LocalizedQueryOptions & {
    id: string
    audiences: WebConfig['audiences']
    limit?: number
  },
): Promise<RelatedLectureCard[]> {
  const audiences = audienceIdList(options.audiences)

  // Audience-gated. With none configured, the site cannot call the endpoint
  // (it 400s), so degrade to no related section. This matches the
  // /for-audience content-index behavior. An admin sets audiences in the
  // WeMeditate Web config.
  if (audiences.length === 0) {
    return []
  }
  const limit = options.limit ?? 8

  try {
    return await withRetryUnlessPreview(async () => {
      const body = await sahajCloudFetchOptional<{ docs?: Array<Record<string, unknown>> }>(
        `/api/meditations/${encodeURIComponent(options.id)}/related-lectures` +
          `?locale=${encodeURIComponent(options.locale)}&limit=${limit}` +
          `&audiences=${audiences.join(',')}`,
        `getRelatedLectures(${options.id})`,
      )
      const docs = Array.isArray(body?.docs) ? body.docs : []

      return docs
        .filter(
          (doc): doc is Record<string, unknown> =>
            typeof doc.id === 'number' &&
            typeof doc.title === 'string' &&
            doc.title.length > 0 &&
            typeof doc.thumbnailUrl === 'string' &&
            doc.thumbnailUrl.length > 0,
        )
        .map((doc) => ({
          id: doc.id as number,
          title: doc.title as string,
          durationSeconds: typeof doc.duration === 'number' ? doc.duration : 0,
          thumbnailUrl: doc.thumbnailUrl as string,
        }))
    })
  } catch (error) {
    console.warn(`[getRelatedLectures] degrading to none for meditation ${options.id}:`, error)
    Sentry.captureMessage('getRelatedLectures failed; rendering meditation without related', {
      level: 'warning',
      tags: { source: 'getRelatedLectures' },
      extra: { meditationId: options.id, locale: options.locale ?? null },
    })

    return []
  }
}
