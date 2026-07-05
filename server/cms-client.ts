/**
 * CMS API client functions using PayloadCMS REST API.
 *
 * This module provides query functions for fetching content from PayloadCMS.
 * Configuration (apiKey, baseURL, kv) is automatically retrieved from the
 * request context - no need to pass these values explicitly.
 *
 * ## Error Handling Strategy
 *
 * Errors propagate naturally for retry compatibility with error-utils.ts:
 * - **Single item queries** (getPageBySlug, getDocumentById):
 *   Return null for empty results, let errors propagate for retry logic.
 * - **Global queries** (getWeMeditateWebSettings):
 *   Use validateSDKResponse() since settings must exist (handles SDK undefined bug).
 * - **List queries** (getPagesByTags, getMeditationsByTags, getMusicByTags):
 *   Return empty array for empty results, let errors propagate for retry logic.
 *
 * Native errors (TypeError for network, Error for SDK) are handled by
 * detectErrorType() in error-utils.ts via message pattern matching.
 */

import { createPayloadClient, validateSDKResponse } from './payload-client'
import { generateCacheKey, withCache, CacheTTL } from './kv-cache'
import { getCmsContext } from './cms-context'
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
  SongTagsSelect,
  ImagesSelect,
  AuthorsSelect,
  VideosSelect,
  WmWebConfigSelect,
} from './payload-types'
import type {
  Locale,
  Page,
  Song,
  WebConfig,
  PageListItem,
  MeditationSong,
  RelatedMeditationCard,
  RelatedLectureCard,
} from './cms-types'

// ============================================================================
// Common Options Interfaces
// ============================================================================

interface LocalizedQueryOptions {
  locale: Locale
}

// ============================================================================
// Field Selection (required by the SahajCloud API client query-validation hook)
//
// The backend rejects API-client reads that omit `select`, or that use depth > 1
// without `populate`. Each query below declares exactly the fields the frontend
// renders. These constants are typed against the generated *Select interfaces so
// that a CMS schema change (pulled via `pnpm types:cms`) surfaces as a compile
// error here rather than a silent 400 / missing field at runtime.
//
// Note on uploads: when selecting an upload's `url`, `filename` must also be
// selected, otherwise PayloadCMS returns `url: null`.
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
// Narrow selects for documents embedded in a Page's `content` (showcase cards,
// subtle-system nodes, content-index lists). Deliberately omit each collection's
// `content`/heavy fields so that bumping page reads to depth 3 stays small:
// collections NOT listed in `populate` come back fully populated (incl. their
// own `content`), which would balloon both the response and the KV cache entry.
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

/** Narrow lecture fields (no public web route yet; populated to cap payload size). */
const EMBEDDED_LECTURE_SELECT = {
  title: true,
  thumbnail: true,
} satisfies LecturesSelect<true>

/** Narrow album fields for showcase cards (artwork thumbnail). */
const EMBEDDED_ALBUM_SELECT = {
  title: true,
  artwork: true,
} satisfies AlbumsSelect<true>

/** Minimal app-card fields (no public web route; populated to cap payload size). */
const EMBEDDED_APP_CARD_SELECT = {
  label: true,
} satisfies AppCardsSelect<true>

/**
 * Populate map for a full Page read (depth 3). The backend rejects depth > 1
 * reads without `populate`; each entry both enables a relationship to populate
 * AND restricts it to the fields the frontend renders. Beyond the author/video
 * byline, this covers the collections referenced from `content` blocks
 * (showcase, subtle-system, image galleries) so they resolve their titles,
 * slugs and thumbnails instead of degrading.
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
}

/** Global config fields: `pages` relationships the layout + home page need, plus
 * `audiences` (the site's fixed audience set the lectures /for-audience feed uses). */
const WEB_CONFIG_SELECT = {
  homePage: true,
  featuredPages: true,
  featuredArticles: true,
  classPages: true,
  knowledgePages: true,
  infoPages: true,
  audiences: true,
} satisfies WmWebConfigSelect<true>

/**
 * Populate the global's page relationships at depth 2 with the fields the layout
 * (title/slug for nav) and the home page (content/meta) render. Required because
 * the backend rejects depth > 1 reads without `populate`.
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
 * Fields rendered for a Lecture. `fullLecture` is selected so a clip can reach
 * its parent's `metadata` (the playback source); see LECTURE_POPULATE.
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
 * self-populates a clip's `fullLecture` relationship with the parent's fields
 * (crucially its `metadata`), so a clip can resolve its HLS URL / duration /
 * base subtitles. `images` populates the thumbnail upload.
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
 * Maps PayloadCMS collection slugs to their cache prefix, TTL, and the
 * select/populate shapes required by the backend query-validation hook.
 */
const COLLECTION_BY_ID_CONFIG = {
  pages: {
    cachePrefix: 'page',
    ttl: CacheTTL.PAGE,
    select: PAGE_SELECT,
    populate: PAGE_POPULATE,
  },
  meditations: {
    cachePrefix: 'meditation',
    ttl: CacheTTL.MEDITATION,
    select: MEDITATION_SELECT,
    populate: IMAGE_POPULATE,
  },
  lectures: {
    cachePrefix: 'lecture',
    ttl: CacheTTL.LECTURE,
    select: LECTURE_SELECT,
    populate: LECTURE_POPULATE,
  },
} as const

type FindByIdCollection = keyof typeof COLLECTION_BY_ID_CONFIG

// ============================================================================
// Single Item Queries
// ============================================================================

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
  },
): Promise<Page | null> {
  const cacheKey = generateCacheKey('page', {
    slug: options.slug,
    locale: options.locale,
  })

  return withCache({
    cacheKey,
    ttl: CacheTTL.PAGE,
    fetchFn: async () => {
      const client = createPayloadClient()

      const result = await client.find({
        collection: 'pages',
        where: {
          slug: { equals: options.slug },
        },
        locale: options.locale,
        limit: 1,
        // depth 3 so relationships embedded in `content` blocks (showcase,
        // subtle-system) resolve their own thumbnails; kept small by the narrow
        // per-collection selects in PAGE_POPULATE.
        depth: 3,
        select: PAGE_SELECT,
        populate: PAGE_POPULATE,
      })

      if (!result?.docs?.length) {
        return null
      }

      const page = result.docs[0] as Page

      if (page._status === 'draft') {
        return null
      }

      return page
    },
  })
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
 * @param options.preview - If true, fetch draft data with trusted preview credentials and bypass cache
 * @returns The document data or null if not found
 */
export async function getDocumentById<C extends FindByIdCollection>(
  options: LocalizedQueryOptions & {
    collection: C
    id: string
    preview?: boolean
    previewSecret?: string
  },
): Promise<Config['collections'][C] | null> {
  const config = COLLECTION_BY_ID_CONFIG[options.collection]
  const isPreview = options.preview === true
  const cacheKey = generateCacheKey(config.cachePrefix, {
    id: options.id,
    locale: options.locale,
  })

  return withCache({
    cacheKey,
    ttl: config.ttl,
    bypassCache: isPreview,
    fetchFn: async () => {
      const client = createPayloadClient({
        preview: isPreview,
        previewSecret: options.previewSecret,
      })

      const found = await client.findByID({
        collection: options.collection,
        id: options.id,
        locale: options.locale,
        // depth 3 to resolve relationships embedded in `content` blocks (see
        // getPageBySlug); bounded by the per-collection selects in PAGE_POPULATE.
        depth: 3,
        draft: isPreview,
        // select/populate are validated per-collection at their definitions above
        // (PAGE_SELECT / MEDITATION_SELECT via `satisfies`). TypeScript can't
        // correlate the union-typed config to the generic collection `C`, so the
        // input is cast here; the response is re-typed to the concrete doc below.
        select: config.select as never,
        populate: config.populate as never,
      })

      const result = found as Config['collections'][C] | null

      if (!result) return null
      // Public requests should never render drafts. Collections without
      // draft/version support (e.g. lectures) have no `_status` and are always
      // live, so only filter where the field actually exists.
      const status = (result as { _status?: string })._status

      if (!isPreview && status === 'draft') return null

      return result
    },
  })
}

/**
 * Retrieves a lecture by ID and normalizes it into a flat `ResolvedLecture`.
 *
 * Full lectures and clips resolve to the same shape; a clip inherits its
 * playback source (HLS URL, duration, base subtitles, thumbnail fallback) from
 * its parent `fullLecture`, which is populated at depth 2 (see LECTURE_POPULATE).
 *
 * @param options.id - The lecture document ID
 * @param options.locale - The locale to retrieve the lecture in
 * @param options.preview - If true, fetch draft data and bypass cache
 * @returns The normalized lecture or null if not found
 */
export async function getLecture(
  options: LocalizedQueryOptions & {
    id: string
    preview?: boolean
    previewSecret?: string
  },
): Promise<ResolvedLecture | null> {
  const lecture = await getDocumentById({ collection: 'lectures', ...options })

  if (!lecture) return null

  const resolved = resolveLecture(lecture)

  // A clip with no resolvable HLS source means its parent `fullLecture` came
  // back unpopulated (a bare id — believed unpublished/trashed) or hasn't synced
  // its Nirmala Vidya metadata. The template degrades to an error state; surface
  // the CMS data gap to Sentry (per the cms-api-reads rule) so it stays visible.
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

// ============================================================================
// Global Settings
// ============================================================================

/**
 * Split a page-relationship array into published, linkable pages (populated
 * objects with a slug) and unresolved references — relationships returned as a
 * bare ID (believed unpublished/trashed: a published page populates, an
 * unpublished one comes back as just its id) or an object missing a slug.
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
 * Retrieves the WebConfig (site configuration).
 *
 * This is a singleton global configuration that contains references to important
 * pages throughout the site (home page, featured pages, class pages, etc.).
 *
 * Unresolved page references (believed unpublished) are dropped so the layout
 * never renders dead `/undefined` links, and reported to Sentry so the
 * underlying CMS data gap stays visible.
 *
 * @returns The web configuration with populated page relationships
 */
export async function getWebConfig(options: { locale?: Locale } = {}): Promise<WebConfig> {
  const cacheKey = generateCacheKey('web-config', { locale: options.locale })

  return withCache({
    cacheKey,
    ttl: CacheTTL.SETTINGS,
    fetchFn: async () => {
      const client = createPayloadClient()

      const result = await client.findGlobal({
        slug: 'wm-web-config',
        depth: 2,
        locale: options.locale,
        select: WEB_CONFIG_SELECT,
        populate: WEB_CONFIG_POPULATE,
      })

      const validated = validateSDKResponse(result, 'WmWebConfig')

      // Drop unresolved (believed-unpublished) page references so the layout
      // never renders dead `/undefined` links — graceful fallback.
      const featured = partitionPublishedPages(validated.featuredPages)
      const featuredArticles = partitionPublishedPages(validated.featuredArticles)
      const classPages = partitionPublishedPages(validated.classPages)
      const knowledgePages = partitionPublishedPages(validated.knowledgePages)
      const infoPages = partitionPublishedPages(validated.infoPages)

      const unresolved = [
        ...(typeof validated.homePage === 'number' ? [`homePage id:${validated.homePage}`] : []),
        ...featured.unresolved.map((u) => `featuredPages ${u}`),
        ...featuredArticles.unresolved.map((u) => `featuredArticles ${u}`),
        ...classPages.unresolved.map((u) => `classPages ${u}`),
        ...knowledgePages.unresolved.map((u) => `knowledgePages ${u}`),
        ...infoPages.unresolved.map((u) => `infoPages ${u}`),
      ]

      // Surface the data gap to Sentry (a published page populates; an
      // unpublished one returns as a bare id) without breaking the page.
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

      return {
        ...validated,
        featuredPages: featured.published,
        featuredArticles: featuredArticles.published,
        classPages: classPages.published,
        knowledgePages: knowledgePages.published,
        infoPages: infoPages.published,
      } as WebConfig
    },
  })
}

// ============================================================================
// List Queries (filtered by tags)
// ============================================================================

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

  const cacheKey = generateCacheKey('pages-by-tags', {
    tags: options.tags,
    locale: options.locale,
    limit,
  })

  return withCache({
    cacheKey,
    ttl: CacheTTL.LIST,
    fetchFn: async () => {
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
    },
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

  const cacheKey = generateCacheKey('songs-by-tags', {
    tagIds: options.tagIds,
    locale: options.locale,
    limit,
  })

  return withCache({
    cacheKey,
    ttl: CacheTTL.SONG,
    fetchFn: async () => {
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
    },
  })
}

/**
 * Retrieves the background-music tracks eligible for a meditation via the custom
 * nested route `GET /api/meditations/:id/songs`.
 *
 * Unlike the standard collection reads above, this endpoint encapsulates the
 * songTag + `includeForMeditations` selection server-side and returns a fixed
 * minimal projection (`{ id, title, url, tags }`) — it does NOT accept `select`
 * and ignores `populate`/`depth`/`limit` (it honors `locale`). Because it is not
 * a collection `find`, the PayloadCMS SDK can't model it, so we issue a raw
 * authenticated fetch (same `clients API-Key` header the SDK sends) wrapped in
 * the shared cache + retry layer.
 *
 * The endpoint returns songs in randomized order on every request; callers pick
 * a track client-side, so a per-TTL-window cached list is fine. Degrades to an
 * empty list for meditations with no eligible songs (HTTP 200 `{ docs: [] }`)
 * and for an unknown id (HTTP 404) so the player simply renders voice-only.
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
  const cacheKey = generateCacheKey('meditation-songs', {
    id: options.id,
    locale: options.locale,
  })

  try {
    return await withCache({
      cacheKey,
      ttl: CacheTTL.SONG,
      fetchFn: async () => {
        const { apiKey, baseURL } = getCmsContext()
        const url = `${baseURL}/api/meditations/${encodeURIComponent(
          options.id,
        )}/songs?locale=${encodeURIComponent(options.locale)}`

        const response = await fetch(url, {
          headers: { Authorization: `clients API-Key ${apiKey}` },
        })

        // Mirror the SDK's request logging so the dev request log stays complete.
        console.log(`[PayloadCMS] GET ${url} → ${response.status}`)

        // Unknown meditation id (or no songs route) → no music, not an error.
        if (response.status === 404) return []

        // Let server/network errors propagate so withCache's retry kicks in.
        if (!response.ok) {
          throw new Error(`getMeditationSongs(${options.id}) failed: ${response.status}`)
        }

        const body = (await response.json()) as {
          docs?: Array<{ id: number; title?: string | null; url?: string | null }>
        }
        const docs = Array.isArray(body.docs) ? body.docs : []

        // Keep only playable tracks (the player needs a real URL); the endpoint
        // omits duration/artwork/credit, so title + url are all we surface.
        return docs
          .filter((doc) => typeof doc.url === 'string' && doc.url.length > 0)
          .map((doc) => ({ id: doc.id, title: doc.title ?? '', url: doc.url as string }))
      },
    })
  } catch (error) {
    // Background music is supplementary — a failure to load it (after withCache's
    // retries) must never break the meditation page. Degrade to voice-only and
    // surface the gap to Sentry. The failed result isn't cached, so the next
    // request retries.
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

/** Extract audience document ids (populated object or bare id) as strings. */
function audienceIdList(audiences: WebConfig['audiences']): string[] {
  if (!audiences) {
    return []
  }

  return audiences
    .map((a) => (typeof a === 'number' ? String(a) : a?.id != null ? String(a.id) : null))
    .filter((id): id is string => id !== null)
}

/**
 * Retrieves the meditations related to a lecture via the shaped nested route
 * `GET /api/lectures/:id/related-meditations` (SahajCloud #523).
 *
 * Like `/songs`, this is not a collection `find`: it encapsulates the
 * subtle-system-node-overlap ranking (with a recency top-up fallback) server-
 * side, returns a fixed card projection, and ignores `select`/`populate`/`depth`
 * (it honors `locale` + `limit`). The SDK can't model it, so we issue a raw
 * authenticated fetch wrapped in the shared cache + retry layer.
 *
 * The endpoint drops any card missing a public title / duration / thumbnail, so
 * the internal `label` never leaks. Meditation titles aren't localized, so the
 * endpoint returns an empty list for non-English locales — the caller simply
 * renders no related section (graceful, not an error). Degrades to `[]` for an
 * unknown lecture id (404) and, after retries, any failure.
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
  const cacheKey = generateCacheKey('related-meditations', {
    id: options.id,
    locale: options.locale,
    limit,
  })

  try {
    return await withCache({
      cacheKey,
      ttl: CacheTTL.LIST,
      fetchFn: async () => {
        const { apiKey, baseURL } = getCmsContext()
        const url =
          `${baseURL}/api/lectures/${encodeURIComponent(options.id)}/related-meditations` +
          `?locale=${encodeURIComponent(options.locale)}&limit=${limit}`

        const response = await fetch(url, {
          headers: { Authorization: `clients API-Key ${apiKey}` },
        })

        console.log(`[PayloadCMS] GET ${url} → ${response.status}`)

        // Unknown lecture id (or no related route) → no related content.
        if (response.status === 404) return []

        if (!response.ok) {
          throw new Error(`getRelatedMeditations(${options.id}) failed: ${response.status}`)
        }

        const body = (await response.json()) as {
          docs?: Array<Record<string, unknown>>
        }
        const docs = Array.isArray(body.docs) ? body.docs : []

        // The endpoint already shapes cards, but guard the fields we render so a
        // partial doc can never surface a blank card or a broken thumbnail.
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
      },
    })
  } catch (error) {
    // Related content is supplementary — a failure to load it must never break
    // the lecture page. Degrade to no related section and surface to Sentry.
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
 * Retrieves the lectures related to a meditation via the shaped nested route
 * `GET /api/meditations/:id/related-lectures` (the mirror of the endpoint
 * above). Unlike `/related-meditations`, this endpoint is audience-gated: it
 * *requires* the site's `audiences` (a 400 without), so with none configured we
 * short-circuit to `[]` rather than issue a request that would 400.
 *
 * The endpoint returns the full lecture player projection ranked by node
 * overlap with an audience/recency fallback; we surface only the card subset
 * (id, title, thumbnail, playable duration). Degrades to `[]` for an unknown
 * meditation id (404) and, after retries, any failure.
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

  // Audience-gated: with none configured the site can't call the endpoint
  // (it 400s), so degrade to no related section — matching the /for-audience
  // content-index behavior. An admin sets audiences in WeMeditate Web config.
  if (audiences.length === 0) {
    return []
  }
  const limit = options.limit ?? 8
  const cacheKey = generateCacheKey('related-lectures', {
    id: options.id,
    locale: options.locale,
    limit,
    // Fold audiences into the key so a config change can't serve a stale list.
    audiences,
  })

  try {
    return await withCache({
      cacheKey,
      ttl: CacheTTL.LIST,
      fetchFn: async () => {
        const { apiKey, baseURL } = getCmsContext()
        const url =
          `${baseURL}/api/meditations/${encodeURIComponent(options.id)}/related-lectures` +
          `?locale=${encodeURIComponent(options.locale)}&limit=${limit}` +
          `&audiences=${audiences.join(',')}`

        const response = await fetch(url, {
          headers: { Authorization: `clients API-Key ${apiKey}` },
        })

        console.log(`[PayloadCMS] GET ${url} → ${response.status}`)

        if (response.status === 404) return []

        if (!response.ok) {
          throw new Error(`getRelatedLectures(${options.id}) failed: ${response.status}`)
        }

        const body = (await response.json()) as {
          docs?: Array<Record<string, unknown>>
        }
        const docs = Array.isArray(body.docs) ? body.docs : []

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
      },
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
