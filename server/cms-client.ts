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

import {
  createPayloadClient,
  validateSDKResponse,
} from './payload-client'
import { generateCacheKey, withCache, CacheTTL } from './kv-cache'
import type { Config } from './payload-types'
import type {
  Locale,
  Page,
  Music,
  WeMeditateWebSettings,
  PageListItem,
  MeditationListItem,
} from './cms-types'

// ============================================================================
// Common Options Interfaces
// ============================================================================

interface LocalizedQueryOptions {
  locale: Locale
}

/**
 * Configuration for collections that support findById queries.
 * Maps PayloadCMS collection slugs to their cache prefix and TTL.
 */
const COLLECTION_BY_ID_CONFIG = {
  pages: { cachePrefix: 'page', ttl: CacheTTL.PAGE },
  meditations: { cachePrefix: 'meditation', ttl: CacheTTL.MEDITATION },
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
export async function getPageBySlug(options: LocalizedQueryOptions & {
  slug: string
}): Promise<Page | null> {
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
        depth: 2,
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
  }
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
      const client = createPayloadClient({ preview: isPreview })

      const result = await client.findByID({
        collection: options.collection,
        id: options.id,
        locale: options.locale,
        depth: 2,
        draft: isPreview,
      })

      if (!result) return null
      // Public requests should never render drafts
      if (!isPreview && result._status === 'draft') return null
      return result as Config['collections'][C]
    },
  })
}

// ============================================================================
// Global Settings
// ============================================================================

/**
 * Retrieves the WeMeditateWebSettings configuration.
 *
 * This is a singleton global configuration that contains references to important
 * pages throughout the site (home page, featured pages, chakra pages, etc.).
 *
 * @returns The web settings configuration
 */
export async function getWeMeditateWebSettings(): Promise<WeMeditateWebSettings> {
  const cacheKey = generateCacheKey('settings', {})

  return withCache({
    cacheKey,
    ttl: CacheTTL.SETTINGS,
    fetchFn: async () => {
      const client = createPayloadClient()

      const result = await client.findGlobal({
        slug: 'we-meditate-web-settings',
        depth: 2,
      })

      return validateSDKResponse(
        result,
        'WeMeditateWebSettings'
      ) as WeMeditateWebSettings
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
 * @param options.tagIds - Array of tag IDs to filter by
 * @param options.locale - The locale to retrieve pages in
 * @param options.limit - Maximum number of pages to return (default: 100)
 * @returns Array of page list items
 */
export async function getPagesByTags(options: LocalizedQueryOptions & {
  tagIds: string[]
  limit?: number
}): Promise<PageListItem[]> {
  const limit = options.limit || 100

  const cacheKey = generateCacheKey('pages-by-tags', {
    tagIds: options.tagIds,
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
        where: { tags: { in: options.tagIds } },
        locale: options.locale,
        limit,
        depth: 2,
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
 * Retrieves a list of meditations filtered by tags (minimal data: id, title, thumbnail).
 *
 * @param options - Query options
 * @param options.tagIds - Array of tag IDs to filter by
 * @param options.locale - The locale to retrieve meditations in
 * @param options.limit - Maximum number of meditations to return (default: 100)
 * @returns Array of meditation list items
 */
export async function getMeditationsByTags(options: LocalizedQueryOptions & {
  tagIds: string[]
  limit?: number
}): Promise<MeditationListItem[]> {
  const limit = options.limit || 100

  const cacheKey = generateCacheKey('meditations-by-tags', {
    tagIds: options.tagIds,
    locale: options.locale,
    limit,
  })

  return withCache({
    cacheKey,
    ttl: CacheTTL.LIST,
    fetchFn: async () => {
      const client = createPayloadClient()

      const result = await client.find({
        collection: 'meditations',
        where: { tags: { in: options.tagIds } },
        locale: options.locale,
        limit,
        depth: 2,
      })

      if (!result?.docs) return []

      return result.docs.map((meditation) => ({
        id: meditation.id,
        title: meditation.title ?? null,
        thumbnail: meditation.thumbnail ?? null,
      })) as MeditationListItem[]
    },
  })
}

/**
 * Retrieves a list of music filtered by tags (full music data).
 *
 * @param options - Query options
 * @param options.tagIds - Array of tag IDs to filter by
 * @param options.locale - The locale to retrieve music in
 * @param options.limit - Maximum number of music items to return (default: 100)
 * @returns Array of music items
 */
export async function getMusicByTags(options: LocalizedQueryOptions & {
  tagIds: string[]
  limit?: number
}): Promise<Music[]> {
  const limit = options.limit || 100

  const cacheKey = generateCacheKey('music-by-tags', {
    tagIds: options.tagIds,
    locale: options.locale,
    limit,
  })

  return withCache({
    cacheKey,
    ttl: CacheTTL.MUSIC,
    fetchFn: async () => {
      const client = createPayloadClient()

      const result = await client.find({
        collection: 'music',
        where: { tags: { in: options.tagIds } },
        locale: options.locale,
        limit,
        depth: 2,
      })

      if (!result?.docs) return []
      return result.docs as Music[]
    },
  })
}
