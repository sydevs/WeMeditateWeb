/**
 * Cloudflare KV cache for the atlas and sitemap reads.
 *
 * It handles cache key generation, TTL, and graceful fallback when KV is
 * unavailable.
 *
 * ⚠ Nothing invalidates this cache. `server/CACHING.md` lists the reads
 * still on it and says why no new read joins them (#98).
 */

import { KVNamespace } from '@cloudflare/workers-types'
import * as Sentry from '@sentry/react'
import { withRetry } from './error-utils'
import { getCmsContext } from './cms-context'

/**
 * Generates a consistent cache key from query parameters.
 *
 * @param prefix - Cache key prefix (e.g., 'atlas-seo', 'content-sitemap-docs')
 * @param params - Key-value parameters to include in the cache key
 * @returns A consistent, URL-safe cache key
 *
 * @example
 * ```typescript
 * const key = generateCacheKey('atlas-seo', { target: 'region:london', locale: 'en' })
 * // Returns: "atlas-seo:locale=en:target=region:london"
 * ```
 */
export function generateCacheKey(
  prefix: string,
  params: Record<string, string | number | undefined>,
): string {
  const parts: string[] = [prefix]

  // Sort keys for consistency
  const sortedKeys = Object.keys(params).sort()

  for (const key of sortedKeys) {
    const value = params[key]

    if (value !== undefined) {
      parts.push(`${key}=${value}`)
    }
  }

  return parts.join(':')
}

/**
 * Gets a cached response from Cloudflare KV.
 *
 * @param kv - Cloudflare KV namespace (optional, returns null if not provided)
 * @param key - Cache key to retrieve
 * @returns Parsed cached data, or null if not found, expired, or unavailable
 */
async function getCachedResponse<T>(kv: KVNamespace | undefined, key: string): Promise<T | null> {
  if (!kv) {
    return null
  }

  try {
    const cached = await kv.get(key, 'json')

    return cached as T | null
  } catch (error) {
    // Log the error. Do not throw, so a cache read failure never blocks
    // the request.
    console.error('KV cache read error:', error)
    Sentry.captureException(error, {
      tags: { cache_operation: 'read' },
      extra: { cacheKey: key },
    })

    return null
  }
}

/**
 * Stores a response in Cloudflare KV, with a TTL.
 *
 * @param kv - Cloudflare KV namespace (optional, does nothing if not provided)
 * @param key - Cache key to store under
 * @param data - Data to cache (must be JSON-serializable)
 * @param ttl - Time to live in seconds
 */
async function setCachedResponse<T>(
  kv: KVNamespace | undefined,
  key: string,
  data: T,
  ttl: number,
): Promise<void> {
  if (!kv) {
    return
  }

  try {
    await kv.put(key, JSON.stringify(data), {
      expirationTtl: ttl,
    })
  } catch (error) {
    // Log the error. Do not throw: caching is not critical.
    console.error('KV cache write error:', error)
    Sentry.captureException(error, {
      tags: { cache_operation: 'write' },
      extra: { cacheKey: key, ttl },
    })
  }
}

/**
 * Wraps a query function with a read-through cache and automatic retry.
 *
 * Read-through cache pattern:
 * 1. Check the cache first.
 * 2. On a cache miss, run the query function, with automatic retry.
 * 3. Store the result in the cache.
 * 4. Return the result.
 *
 * Retry behavior: this function retries network and server errors
 * automatically, but not client errors like 404. It uses exponential
 * backoff with jitter (1s, 2s, 4s).
 *
 * A cache-operation error is logged to Sentry and never interrupts the
 * request: this function still runs the query and returns its result
 * without caching it.
 *
 * @param options - Cache configuration options
 * @param options.cacheKey - Cache key to use
 * @param options.ttl - Time to live in seconds
 * @param options.fetchFn - Async function that executes the query
 * @returns The query result, from the cache or freshly fetched
 *
 * @example
 * ```typescript
 * // KV comes from context automatically.
 * const urls = await withCache({
 *   cacheKey: generateCacheKey('atlas-sitemap', { origin }),
 *   ttl: AtlasCacheTTL.REGION,
 *   fetchFn: async () => await readEveryAtlasUrl(origin),
 * })
 * ```
 */
export async function withCache<T>(options: {
  cacheKey: string
  ttl: number
  fetchFn: () => Promise<T>
}): Promise<T> {
  const { cacheKey, ttl, fetchFn } = options

  // KV comes from the CMS context. It may be undefined in local dev.
  const { kv } = getCmsContext()

  const cached = await getCachedResponse<T>(kv, cacheKey)

  if (cached !== null) {
    return cached
  }

  // Cache miss. Run the query, with retry.
  const result = await withRetry(fetchFn)

  // Store the result for next time. Do not wait for this to finish.
  void setCachedResponse(kv, cacheKey, result, ttl)

  return result
}
