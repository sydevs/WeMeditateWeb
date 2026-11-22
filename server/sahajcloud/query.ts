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
 *   empty result, then let errors propagate. `getDocumentById` also answers a
 *   404 with null: an id the collection does not hold is an empty result the
 *   SDK happens to report as a throw.
 * - The global query (getWebConfig) lets errors propagate. The SDK throws a
 *   PayloadSDKError carrying the status, so error-utils.ts classifies it.
 *
 * error-utils.ts classifies by HTTP status where the error carries one, and
 * falls back to message patterns for errors that do not (a network TypeError).
 */

import { withRetry } from '@/server/error-utils'
import type { Locale } from '@/types/sahajcloud'

export interface LocalizedQueryOptions {
  locale: Locale
}

/**
 * A preview read skips the retry on purpose. An editor watching their own
 * edit needs the error now, not after about 7s of backoff.
 */
export function withRetryUnlessPreview<T>(
  fetchFn: () => Promise<T>,
  options: { preview?: boolean } = {},
): Promise<T> {
  return options.preview === true ? fetchFn() : withRetry(fetchFn)
}
