/**
 * Live preview: keeping the token out of anything that records a URL.
 *
 * The token rides in the query string, because an iframe navigation cannot
 * carry a header. That puts it everywhere a URL is read:
 *
 * - **the address bar**, and so `document.referrer` of anything the page opens
 * - **Plausible**, which reads `location.href` in JS and posts it — no
 *   `Referrer-Policy` and no Sentry hook touches that
 * - **Sentry session replay**, which runs at 10% of sessions and 100% after an
 *   error, recording request URLs and navigation breadcrumbs
 *
 * A token expires in under an hour, which bounds the damage but does not make
 * it acceptable in a third party's logs.
 *
 * ## Three functions, and the differences are the return types
 *
 * `stripLivePreviewToken` is pure: a URL in, a URL out, nothing touched. It is
 * called on every value Sentry is about to send, over and over.
 *
 * `scrubAddressBar` takes nothing and returns nothing. It is a side effect on
 * `window.history`, called exactly once, from the client entry. It uses the
 * pure one; it is not a variant of it.
 *
 * `livePreviewToken` reads what the scrub caught on its way past. The token is
 * deliberately absent from `passToClient` (see `protocol.ts`), so the URL the
 * iframe was opened with is the only copy the browser ever has, and the scrub
 * is the last moment it exists.
 */

import { LIVE_PREVIEW_PARAM } from './protocol'

/** The token this page was opened with. Module state, never `pageContext`. */
let sessionToken: string | null = null

/** Removes the token from a URL string, leaving everything else untouched. */
export function stripLivePreviewToken(url: string): string {
  try {
    const parsed = new URL(url)

    if (!parsed.searchParams.has(LIVE_PREVIEW_PARAM)) return url

    parsed.searchParams.delete(LIVE_PREVIEW_PARAM)

    return parsed.toString()
  } catch {
    // Not a parseable URL. Returning it unchanged is right: Sentry passes
    // breadcrumb values that are sometimes a bare path or a label, and
    // mangling those would lose information without protecting anything.
    return url
  }
}

/**
 * Rewrites the address bar in place so the token is not in it. Runs once.
 *
 * ⚠ **Must run before Plausible reads `location.href`.** It is a `defer`red
 * script, so it executes after the document parses — this runs at module
 * evaluation of the client entry, which is earlier.
 *
 * `replaceState`, not `pushState`: the token should not become a history entry
 * the editor can navigate back to.
 *
 * Only the token is removed. The pathname, the other parameters and the hash
 * all stay — the scope parameter is not a credential, and dropping the hash
 * would silently break an in-page anchor an editor was looking at.
 */
export function scrubAddressBar(): void {
  if (typeof window === 'undefined') return

  const scrubbed = stripLivePreviewToken(window.location.href)

  if (scrubbed === window.location.href) return

  // Caught on the way past, because after the next line there is nowhere left
  // to read it from. See `livePreviewToken` below.
  sessionToken = new URL(window.location.href).searchParams.get(LIVE_PREVIEW_PARAM)

  window.history.replaceState(window.history.state, '', scrubbed)
}

/**
 * The token this preview session was opened with, held in memory only.
 *
 * `null` on the server, and on every page opened without one — which is every
 * ordinary page view.
 *
 * ⚠ **A caller must not treat this as proof of anything.** It is whatever was
 * in the address bar, and the address bar is the visitor's. The populate proxy
 * (`server/api-routes.ts`) re-verifies the signature before it spends the
 * server's API key, so a browser holding a forged or expired value gets a 403,
 * not draft content.
 */
export function livePreviewToken(): string | null {
  return sessionToken
}
