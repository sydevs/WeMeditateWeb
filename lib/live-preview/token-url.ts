/**
 * Live preview: keeping the token out of `location.href`.
 *
 * The token rides in the query string, because an iframe navigation cannot
 * carry a header. That puts it in `location.href`, and `location.href` is what
 * in-page third-party JavaScript reads:
 *
 * - **Plausible** reads it and posts it with every pageview. No response
 *   header reaches that — `Referrer-Policy` governs what the browser sends,
 *   not what a script chooses to read.
 * - **Sentry session replay** records request URLs and navigation breadcrumbs,
 *   on 10% of sessions and 100% after an error.
 *
 * ⚠ **Not the address bar, which is what this used to claim.** A preview runs
 * in an iframe inside the CMS admin, so the browser displays
 * `cloud.sydevelopers.com/admin/…` and this page's URL is never shown to
 * anyone. `window.history.replaceState` is not here to change what an editor
 * sees; it is the only way to change `location.href` without navigating.
 *
 * ## What the scrub is worth, which is the question it keeps being asked
 *
 * A leaked token grants **nothing on its own**. SahajCloud's
 * `createAccessConfig` runs `hasPermission` first, and lifts its published-only
 * clause only for a request already authenticated as a `clients` user. A token
 * with no API key behind it is not a `clients` user, so it reads exactly what
 * the public reads. The exposure is a leaked token **combined with** an API
 * key — which is not hypothetical, because the atlas ships a browser-usable
 * one (`PUBLIC__SAHAJ_ATLAS_KEY`, in this site's own HTML by design).
 *
 * That, plus a 45–90 minute verify-only lifetime, is what bounds the risk. It
 * is not a reason to hand the first half of the pair to a third party's logs,
 * where it outlives the session it was minted for.
 *
 * ## Two readers, two different mechanisms
 *
 * Sentry is handled here: `sentryBrowserConfig` calls the scrub as its own
 * first statement, so it can only ever initialise against a clean URL.
 * Plausible is **not** — its `<script defer>` in `pages/+Head.tsx` runs the
 * moment parsing ends, and the client entry is an `async` module at the end of
 * `<body>` that dynamically imports a hashed chunk, so the scrub loses that
 * race every time. `+Head.tsx` therefore omits the tag entirely under a
 * preview. This file protects everything else that reads the URL later.
 *
 * ## Three functions, and the differences are the return types
 *
 * `stripLivePreviewToken` is pure: a URL in, a URL out, nothing touched.
 *
 * `scrubTokenFromLocation` takes nothing and returns nothing. It is a side
 * effect on `window.history`, called from the client entry and from
 * `sentryBrowserConfig`. It uses the pure one; it is not a variant of it.
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
    // Not a parseable URL. Returning it unchanged is right: a caller passes
    // values that are sometimes a bare path or a label, and mangling those
    // would lose information without protecting anything.
    return url
  }
}

/**
 * Rewrites `location.href` in place so the token is not in it.
 *
 * Idempotent: a URL with no token is returned identical by
 * `stripLivePreviewToken`, and this early-returns on that. So it is safe to
 * call from more than one place, which is exactly what it is for — the client
 * entry calls it, and `sentryBrowserConfig` calls it again rather than trust a
 * call order in another module.
 *
 * `replaceState`, not `pushState`: the token should not become a history entry,
 * and there is nothing to navigate back to in an iframe anyway.
 *
 * Only the token is removed. The pathname, the other parameters and the hash
 * all stay — the scope parameter is not a credential, and dropping the hash
 * would silently break an in-page anchor an editor was looking at.
 */
export function scrubTokenFromLocation(): void {
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
 * in the URL, and the URL is the visitor's. The populate proxy
 * (`server/api-routes.ts`) re-verifies the signature before it spends the
 * server's API key, so a browser holding a forged or expired value gets a 403,
 * not draft content.
 */
export function livePreviewToken(): string | null {
  return sessionToken
}
