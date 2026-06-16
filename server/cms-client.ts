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
  LecturesSelect,
  SongTagsSelect,
  ImagesSelect,
  AuthorsSelect,
  VideosSelect,
  WmWebConfigSelect,
} from './payload-types'
import type { Locale, Page, Song, WebConfig, PageListItem } from './cms-types'

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

/** Global config fields — all are `pages` relationships the layout + home page need. */
const WEB_CONFIG_SELECT = {
  homePage: true,
  featuredPages: true,
  classPages: true,
  knowledgePages: true,
  infoPages: true,
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
      const classPages = partitionPublishedPages(validated.classPages)
      const knowledgePages = partitionPublishedPages(validated.knowledgePages)
      const infoPages = partitionPublishedPages(validated.infoPages)

      const unresolved = [
        ...(typeof validated.homePage === 'number' ? [`homePage id:${validated.homePage}`] : []),
        ...featured.unresolved.map((u) => `featuredPages ${u}`),
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
