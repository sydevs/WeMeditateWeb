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
 * - Preview mode: Cache bypass flag available (always fetch fresh data when enabled)
 * - Retry: Automatic retry with exponential backoff for network/server errors
 */

import { KVNamespace } from "@cloudflare/workers-types"
import * as Sentry from "@sentry/react"
import { withRetry, type RetryConfig } from './error-utils'
import { getCmsContext } from './cms-context'

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
 */
async function getCachedResponse<T>(
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
    // Log error to Sentry and console but don't throw - graceful degradation
    console.error('KV cache read error:', error)
    Sentry.captureException(error, {
      tags: { cache_operation: 'read' },
      extra: { cacheKey: key }
    })
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
 */
async function setCachedResponse<T>(
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
    // Log error to Sentry and console but don't throw - caching is not critical
    console.error('KV cache write error:', error)
    Sentry.captureException(error, {
      tags: { cache_operation: 'write' },
      extra: { cacheKey: key, ttl }
    })
  }
}

/**
 * Default retry configuration for network/server errors.
 * These values provide a good balance between resilience and latency.
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  /** Maximum number of retry attempts (1 initial + 2 retries) */
  maxAttempts: 3,
  /** Base delay for exponential backoff (1s, 2s, 4s) */
  baseDelayMs: 1000,
}

/**
 * Wrapper for caching GraphQL query results with automatic retry.
 *
 * This function implements a read-through cache pattern with retry logic:
 * 1. Check cache first (unless bypassCache is true)
 * 2. If cache miss, execute the query function with automatic retry
 * 3. Store result in cache before returning (unless bypassCache is true)
 * 4. Return the result
 *
 * Retry behavior:
 * - Automatically retries network and server errors (not client errors like 404)
 * - Uses exponential backoff with jitter (1s, 2s, 4s)
 * - Override defaults via retryConfig parameter if needed
 *
 * Errors during cache operations are logged to Sentry but do not interrupt the request.
 * If caching fails, the query function is executed and the result is returned without caching.
 *
 * @param options - Cache configuration options
 * @param options.cacheKey - Cache key to use
 * @param options.ttl - Time to live in seconds
 * @param options.fetchFn - Async function that executes the query
 * @param options.bypassCache - If true, skip cache read/write (useful for preview mode)
 * @param options.retryConfig - Optional retry configuration (overrides env defaults)
 * @returns The query result (either from cache or fresh)
 *
 * @example
 * ```typescript
 * // KV is automatically retrieved from context:
 * const page = await withCache({
 *   cacheKey: generateCacheKey('page', { slug: 'home', locale: 'en' }),
 *   ttl: CacheTTL.PAGE,
 *   fetchFn: async () => await client.request(query, variables)
 * })
 *
 * // For preview mode (bypass cache, still retries):
 * const previewPage = await withCache({
 *   cacheKey: generateCacheKey('page', { id: '123', locale: 'en' }),
 *   ttl: CacheTTL.PAGE,
 *   fetchFn: async () => await client.request(query, variables),
 *   bypassCache: true
 * })
 * ```
 */
export async function withCache<T>(options: {
  cacheKey: string
  ttl: number
  fetchFn: () => Promise<T>
  bypassCache?: boolean
  retryConfig?: RetryConfig
}): Promise<T> {
  const { cacheKey, ttl, fetchFn, bypassCache = false, retryConfig } = options

  // Get KV from CMS context (may be undefined in local dev)
  const { kv } = getCmsContext()

  // Get retry configuration (use provided config or defaults)
  const finalRetryConfig = retryConfig || DEFAULT_RETRY_CONFIG

  // If bypass flag is set, skip cache but still use retry
  if (bypassCache) {
    return await withRetry(fetchFn, finalRetryConfig)
  }

  // Try to get from cache first
  const cached = await getCachedResponse<T>(kv, cacheKey)
  if (cached !== null) {
    return cached
  }

  // Cache miss - execute the query with retry logic
  const result = await withRetry(fetchFn, finalRetryConfig)

  // Store in cache for next time (fire and forget)
  void setCachedResponse(kv, cacheKey, result, ttl)

  return result
}
