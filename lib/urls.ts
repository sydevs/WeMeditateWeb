/**
 * How this site spells a URL: the locale-free path, and the absolute URL a
 * given locale serves that path at.
 *
 * Both rules belong to routing, not to any one consumer. `+onBeforeRoute`
 * creates the `/index` spelling and 301s `/en/x` to `/x`, and these two
 * functions are the inverse of what it does. The language dropdown
 * (`layouts/LayoutChrome.tsx`), the canonical (`lib/head.tsx`) and the
 * `hreflang` cluster (`lib/hreflang.ts`) all need the same answer, so they
 * read it from here rather than each restating the routing rule.
 *
 * Nothing here does I/O. A path is a string operation on a path the caller
 * already holds.
 */

import type { Locale } from '../server/cms-types'
import { DEFAULT_LOCALE } from '../server/cms-types'

/**
 * True if the URL parses and uses an http(s) scheme.
 *
 * ⚠ **The gate on any URL this site did not author itself**, and the only
 * thing standing between a configured value and `javascript:` or `data:`
 * running in our origin. Two values need it today: the status-page link
 * (`ErrorFallback`) and an authored form's redirect (`lib/cms-forms.ts`),
 * which reaches `window.location.href` on a successful submission.
 *
 * It lives here because a scheme is how a URL is spelled, which this module
 * owns.
 */
export function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url)

    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * True if the URL is safe to navigate the browser to: an http(s) URL, or a
 * root-relative path on this site.
 *
 * Wider than {@link isSafeHttpUrl} by exactly one case, and an editor's most
 * likely one — `/thank-you` is a path, which `new URL` alone cannot parse.
 *
 * ⚠ **This gates the scheme, not the destination.** An editor is allowed to
 * send a visitor to another site, so an off-site URL passes. Anything that
 * tries to read as a path and leave anyway — `//host`, or `/\host`, which
 * browsers fold to `//host` — is therefore not a case worth excluding: the
 * plain spelling of the same destination is already allowed.
 */
export function isSafeNavigationUrl(url: string): boolean {
  return url.startsWith('/') || isSafeHttpUrl(url)
}

/**
 * The locale-free path, in the spelling the URL builders below expect.
 *
 * `+onBeforeRoute` rewrites `/` to `/index` before routing, and
 * `pageContext.urlPathname` carries that spelling through to the render.
 * `/index` is not a URL anyone should be pointed at. A trailing slash goes
 * too, so `/about/` and `/about` are not two URLs each claiming to be the
 * other's canonical.
 */
export function normalizeContentPath(pathname: string | null | undefined): string {
  if (!pathname || pathname === '/index') {
    return '/'
  }

  return pathname.replace(/\/+$/, '') || '/'
}

/**
 * The absolute URL a locale serves an already-normalized path at.
 *
 * English is served bare, because `+onBeforeRoute` 301s `/en/x` to `/x`.
 * Advertising `/en/x` would advertise a redirect, which is the one thing a
 * canonical must never be.
 *
 * Pass a path from `normalizeContentPath`. This does not re-normalize: it
 * runs once per locale, and the path is the same on every one of them.
 */
export function localeUrl(origin: string, locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) {
    return `${origin}${path}`
  }

  // `/fr` rather than `/fr/`: `+onBeforeRoute`'s pattern matches a bare
  // prefix and resolves it to the home page.
  return path === '/' ? `${origin}/${locale}` : `${origin}/${locale}${path}`
}
