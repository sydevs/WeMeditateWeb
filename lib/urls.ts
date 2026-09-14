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
