/**
 * Cloudflare KV cache utilities for GraphQL responses.
 *
 * This module provides a caching layer for GraphQL queries using Cloudflare KV.
 * It handles cache key generation, TTL management, and graceful fallback when KV is unavailable.
 *
 * Cache Strategy:
 * - Pages: 1 hour TTL (frequently updated content)
 * - Settings: 24 hours TTL (rarely updated global config)
 * - Lists: 30 minutes TTL (dynamic content like tags)
 * - Preview mode: No caching (always fetch fresh data)
 */

import { KVNamespace } from "@cloudflare/workers-types"

/**
 * Default TTL values in seconds
 */
export const CacheTTL = {
  /** Page content cache duration (1 hour) */
  PAGE: 3600,
  /** Web settings cache duration (24 hours) */
  SETTINGS: 86400,
  /** List queries cache duration (30 minutes) */
  LIST: 1800,
  /** Meditation content cache duration (1 hour) */
  MEDITATION: 3600,
  /** Music content cache duration (1 hour) */
  MUSIC: 3600,
} as const

/**
 * Generates a consistent cache key from query parameters.
 *
 * @param prefix - Cache key prefix (e.g., 'page', 'meditation', 'settings')
 * @param params - Key-value parameters to include in the cache key
 * @returns A consistent, URL-safe cache key
 *
 * @example
 * ```typescript
 * const key = generateCacheKey('page', { slug: 'home', locale: 'en' })
 * // Returns: "page:slug=home:locale=en"
 * ```
 */
export function generateCacheKey(
  prefix: string,
  params: Record<string, string | string[] | number | undefined>
): string {
  const parts: string[] = [prefix]

  // Sort keys for consistency
  const sortedKeys = Object.keys(params).sort()

  for (const key of sortedKeys) {
    const value = params[key]
    if (value !== undefined) {
      // Handle arrays (e.g., tag IDs)
      if (Array.isArray(value)) {
        parts.push(`${key}=${value.sort().join(',')}`)
      } else {
        parts.push(`${key}=${value}`)
      }
    }
  }

  return parts.join(':')
}

/**
 * Retrieves a cached GraphQL response from Cloudflare KV.
 *
 * @param kv - Cloudflare KV namespace (optional, returns null if not provided)
 * @param key - Cache key to retrieve
 * @returns Parsed cached data or null if not found/expired/unavailable
 *
 * @example
 * ```typescript
 * const cached = await getCachedResponse<Page>(kv, 'page:slug=home:locale=en')
 * if (cached) {
 *   return cached
 * }
 * ```
 */
export async function getCachedResponse<T>(
  kv: KVNamespace | undefined,
  key: string
): Promise<T | null> {
  // Graceful fallback: if KV is not available, skip caching
  if (!kv) {
    return null
  }

  try {
    const cached = await kv.get(key, 'json')
    return cached as T | null
  } catch (error) {
    // Log error but don't throw - graceful degradation
    console.error('KV cache read error:', error)
    return null
  }
}

/**
 * Stores a GraphQL response in Cloudflare KV with TTL.
 *
 * @param kv - Cloudflare KV namespace (optional, does nothing if not provided)
 * @param key - Cache key to store under
 * @param data - Data to cache (must be JSON-serializable)
 * @param ttl - Time to live in seconds
 *
 * @example
 * ```typescript
 * await setCachedResponse(kv, 'page:slug=home:locale=en', pageData, CacheTTL.PAGE)
 * ```
 */
export async function setCachedResponse<T>(
  kv: KVNamespace | undefined,
  key: string,
  data: T,
  ttl: number
): Promise<void> {
  // Graceful fallback: if KV is not available, skip caching
  if (!kv) {
    return
  }

  try {
    await kv.put(key, JSON.stringify(data), {
      expirationTtl: ttl,
    })
  } catch (error) {
    // Log error but don't throw - caching is not critical
    console.error('KV cache write error:', error)
  }
}

/**
 * Wrapper for caching GraphQL query results.
 *
 * This function implements a read-through cache pattern:
 * 1. Check cache first
 * 2. If cache miss, execute the query function
 * 3. Store result in cache before returning
 * 4. Return the result
 *
 * @param kv - Cloudflare KV namespace (optional)
 * @param cacheKey - Cache key to use
 * @param ttl - Time to live in seconds
 * @param queryFn - Async function that executes the GraphQL query
 * @returns The query result (either from cache or fresh)
 *
 * @example
 * ```typescript
 * const page = await withCache(
 *   kv,
 *   'page:slug=home:locale=en',
 *   CacheTTL.PAGE,
 *   async () => await client.request(query, variables)
 * )
 * ```
 */
export async function withCache<T>(
  kv: KVNamespace | undefined,
  cacheKey: string,
  ttl: number,
  queryFn: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = await getCachedResponse<T>(kv, cacheKey)
  if (cached !== null) {
    return cached
  }

  // Cache miss - execute the query
  const result = await queryFn()

  // Store in cache for next time (fire and forget)
  void setCachedResponse(kv, cacheKey, result, ttl)

  return result
}
