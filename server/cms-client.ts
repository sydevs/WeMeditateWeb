/**
 * CMS API client functions using PayloadCMS REST API.
 *
 * This module provides the same API as the previous GraphQL client,
 * ensuring a seamless migration for consuming code.
 *
 * ## Error Handling Strategy
 *
 * All functions convert SDK errors to PayloadAPIError for retry compatibility:
 * - **Single item queries** (getPageBySlug, getPageById, getMeditationById):
 *   Return null for empty results, throw PayloadAPIError for network/SDK errors.
 * - **Global queries** (getWeMeditateWebSettings):
 *   Use validateSDKResponse() since settings must exist.
 * - **List queries** (getPagesByTags, getMeditationsByTags, getMusicByTags):
 *   Return empty array for empty results, throw PayloadAPIError for errors.
 *
 * This ensures the retry logic in error-utils.ts can properly retry
 * network and server errors across all query types.
 */

import type { KVNamespace } from '@cloudflare/workers-types'
import {
  createPayloadClient,
  validateSDKResponse,
  PayloadAPIError,
} from './payload-client'
import { generateCacheKey, withCache, CacheTTL } from './kv-cache'
import type {
  Locale,
  Page,
  Meditation,
  Music,
  WeMeditateWebSettings,
  PageListItem,
  MeditationListItem,
} from './cms-types'

// ============================================================================
// Common Options Interfaces
// ============================================================================

interface BaseQueryOptions {
  apiKey: string
  baseURL?: string
  kv?: KVNamespace
}

interface LocalizedQueryOptions extends BaseQueryOptions {
  locale: Locale
}

// ============================================================================
// Single Item Queries
// ============================================================================

/**
 * Retrieves a specific page by slug and locale.
 *
 * @param options - Query options
 * @param options.apiKey - PayloadCMS API key for authentication
 * @param options.slug - The page slug to search for
 * @param options.locale - The locale to retrieve the page in
 * @param options.baseURL - Optional base URL for the CMS API
 * @param options.kv - Optional Cloudflare KV namespace for caching
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
    kv: options.kv,
    cacheKey,
    ttl: CacheTTL.PAGE,
    fetchFn: async () => {
      const client = createPayloadClient({
        apiKey: options.apiKey,
        baseURL: options.baseURL,
      })

      try {
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

        return result.docs[0] as Page
      } catch (error) {
        // Convert SDK errors to PayloadAPIError for retry compatibility
        if (error instanceof Error) {
          throw new PayloadAPIError(error.message, 500)
        }
        throw error
      }
    },
  })
}

/**
 * Retrieves a specific page by ID.
 *
 * This function supports caching with an optional bypass flag for preview mode.
 * When used in preview mode, set bypassCache to true to ensure fresh data.
 *
 * @param options - Query options
 * @param options.apiKey - PayloadCMS API key for authentication
 * @param options.id - The page ID to retrieve
 * @param options.locale - The locale to retrieve the page in
 * @param options.baseURL - Optional base URL for the CMS API
 * @param options.kv - Optional Cloudflare KV namespace for caching
 * @param options.bypassCache - If true, bypass cache (useful for preview mode)
 * @returns The page data or null if not found
 */
export async function getPageById(options: LocalizedQueryOptions & {
  id: string
  bypassCache?: boolean
}): Promise<Page | null> {
  const cacheKey = generateCacheKey('page', {
    id: options.id,
    locale: options.locale,
  })

  return withCache({
    kv: options.kv,
    cacheKey,
    ttl: CacheTTL.PAGE,
    bypassCache: options.bypassCache,
    fetchFn: async () => {
      const client = createPayloadClient({
        apiKey: options.apiKey,
        baseURL: options.baseURL,
      })

      try {
        const result = await client.findByID({
          collection: 'pages',
          id: options.id,
          locale: options.locale,
          depth: 2,
        })

        if (!result) return null
        return result as Page
      } catch (error) {
        // Convert SDK errors to PayloadAPIError for retry compatibility
        if (error instanceof Error) {
          throw new PayloadAPIError(error.message, 500)
        }
        throw error
      }
    },
  })
}

/**
 * Retrieves a specific meditation by ID.
 *
 * @param options - Query options
 * @param options.apiKey - PayloadCMS API key for authentication
 * @param options.id - The meditation ID to retrieve
 * @param options.locale - The locale to retrieve the meditation in
 * @param options.baseURL - Optional base URL for the CMS API
 * @param options.kv - Optional Cloudflare KV namespace for caching
 * @param options.bypassCache - If true, bypass cache (useful for preview mode)
 * @returns The meditation data or null if not found
 */
export async function getMeditationById(options: LocalizedQueryOptions & {
  id: string
  bypassCache?: boolean
}): Promise<Meditation | null> {
  const cacheKey = generateCacheKey('meditation', {
    id: options.id,
    locale: options.locale,
  })

  return withCache({
    kv: options.kv,
    cacheKey,
    ttl: CacheTTL.MEDITATION,
    bypassCache: options.bypassCache,
    fetchFn: async () => {
      const client = createPayloadClient({
        apiKey: options.apiKey,
        baseURL: options.baseURL,
      })

      try {
        const result = await client.findByID({
          collection: 'meditations',
          id: options.id,
          locale: options.locale,
          depth: 2,
        })

        if (!result) return null
        return result as Meditation
      } catch (error) {
        // Convert SDK errors to PayloadAPIError for retry compatibility
        if (error instanceof Error) {
          throw new PayloadAPIError(error.message, 500)
        }
        throw error
      }
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
 * @param options - Query options
 * @param options.apiKey - PayloadCMS API key for authentication
 * @param options.baseURL - Optional base URL for the CMS API
 * @param options.kv - Optional Cloudflare KV namespace for caching
 * @returns The web settings configuration
 */
export async function getWeMeditateWebSettings(
  options: BaseQueryOptions
): Promise<WeMeditateWebSettings> {
  const cacheKey = generateCacheKey('settings', {})

  return withCache({
    kv: options.kv,
    cacheKey,
    ttl: CacheTTL.SETTINGS,
    fetchFn: async () => {
      const client = createPayloadClient({
        apiKey: options.apiKey,
        baseURL: options.baseURL,
      })

      try {
        const result = await client.findGlobal({
          slug: 'we-meditate-web-settings',
          depth: 2,
        })

        return validateSDKResponse(
          result,
          'WeMeditateWebSettings'
        ) as WeMeditateWebSettings
      } catch (error) {
        // Convert SDK errors to PayloadAPIError for retry compatibility
        if (error instanceof Error) {
          throw new PayloadAPIError(error.message, 500)
        }
        throw error
      }
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
 * @param options.apiKey - PayloadCMS API key for authentication
 * @param options.tagIds - Array of tag IDs to filter by
 * @param options.locale - The locale to retrieve pages in
 * @param options.limit - Maximum number of pages to return (default: 100)
 * @param options.baseURL - Optional base URL for the CMS API
 * @param options.kv - Optional Cloudflare KV namespace for caching
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
    kv: options.kv,
    cacheKey,
    ttl: CacheTTL.LIST,
    fetchFn: async () => {
      const client = createPayloadClient({
        apiKey: options.apiKey,
        baseURL: options.baseURL,
      })

      try {
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
      } catch (error) {
        // Convert SDK errors to PayloadAPIError for retry compatibility
        if (error instanceof Error) {
          throw new PayloadAPIError(error.message, 500)
        }
        throw error
      }
    },
  })
}

/**
 * Retrieves a list of meditations filtered by tags (minimal data: id, title, thumbnail).
 *
 * @param options - Query options
 * @param options.apiKey - PayloadCMS API key for authentication
 * @param options.tagIds - Array of tag IDs to filter by
 * @param options.locale - The locale to retrieve meditations in
 * @param options.limit - Maximum number of meditations to return (default: 100)
 * @param options.baseURL - Optional base URL for the CMS API
 * @param options.kv - Optional Cloudflare KV namespace for caching
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
    kv: options.kv,
    cacheKey,
    ttl: CacheTTL.LIST,
    fetchFn: async () => {
      const client = createPayloadClient({
        apiKey: options.apiKey,
        baseURL: options.baseURL,
      })

      try {
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
      } catch (error) {
        // Convert SDK errors to PayloadAPIError for retry compatibility
        if (error instanceof Error) {
          throw new PayloadAPIError(error.message, 500)
        }
        throw error
      }
    },
  })
}

/**
 * Retrieves a list of music filtered by tags (full music data).
 *
 * @param options - Query options
 * @param options.apiKey - PayloadCMS API key for authentication
 * @param options.tagIds - Array of tag IDs to filter by
 * @param options.locale - The locale to retrieve music in
 * @param options.limit - Maximum number of music items to return (default: 100)
 * @param options.baseURL - Optional base URL for the CMS API
 * @param options.kv - Optional Cloudflare KV namespace for caching
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
    kv: options.kv,
    cacheKey,
    ttl: CacheTTL.MUSIC,
    fetchFn: async () => {
      const client = createPayloadClient({
        apiKey: options.apiKey,
        baseURL: options.baseURL,
      })

      try {
        const result = await client.find({
          collection: 'music',
          where: { tags: { in: options.tagIds } },
          locale: options.locale,
          limit,
          depth: 2,
        })

        if (!result?.docs) return []
        return result.docs as Music[]
      } catch (error) {
        // Convert SDK errors to PayloadAPIError for retry compatibility
        if (error instanceof Error) {
          throw new PayloadAPIError(error.message, 500)
        }
        throw error
      }
    },
  })
}
