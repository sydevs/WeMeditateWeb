/**
 * Where an address on the retired Rails site (`sydevs/WeMeditate`) now lives.
 *
 * A pure function over `map.generated.json`, which
 * `scripts/legacy-redirects/generate.ts` builds from the old database and the
 * pages SahajCloud serves today. `server/legacy-redirects.ts` consults it only
 * for a request that would otherwise 404, and appends the query string itself.
 * It returns a path on this site, never a URL, and `null` for an address the
 * old site never had.
 *
 * Every target is a page that answers 200 in the visitor's own language when
 * that page is published there, and in English otherwise. A target is never
 * the request itself and never another address this function redirects, so a
 * redirect is one hop.
 *
 * See `data/legacy-redirects/README.md`.
 */

import { lookupIn, type LegacyRedirectMap } from './core'
import rawMap from './map.generated.json'

const MAP = rawMap as unknown as LegacyRedirectMap

/**
 * The path an old-site address redirects to on the new site, or `null` when
 * the old site never had it, or the address is already where it should be.
 * `pathname` is the raw request path, percent-encoded or not.
 */
export function lookupLegacyRedirect(pathname: string): string | null {
  return lookupIn(MAP, pathname)
}
