/**
 * How this site spells a URL: which locale a path is served in, the
 * locale-free path, and the absolute URL a given locale serves that path at.
 *
 * These rules belong to routing, not to any one consumer. `+onBeforeRoute`
 * creates the `/index` spelling and 301s `/en/x` to `/x`, out of the same
 * derivation the read side inverts here. The language dropdown
 * (`layouts/LayoutChrome.tsx`), the canonical (`lib/head.tsx`) and the
 * `hreflang` cluster (`lib/hreflang.ts`) all need the same answer, so they
 * read it from here rather than each restating the routing rule.
 *
 * Nothing here does I/O. A path is a string operation on a path the caller
 * already holds.
 */

import type { Locale } from '../server/cms-types'
import { DEFAULT_LOCALE, isLocale } from '../server/cms-types'

/** What a path's leading segment says about the locale. */
export interface PathLocale {
  locale: Locale
  /** The path with the prefix removed, in the `/index` spelling of `/`. */
  pathWithoutLocale: string
  /** Whether a prefix was there to remove. `/about` and `/en/about` agree on
   * everything above, and only the second one 301s. */
  prefixed: boolean
}

/**
 * The locale a path is served in, and the path underneath it.
 *
 * `+onBeforeRoute` reads it on the nominal path and `+onCreatePageContext` on
 * the error page, which Vike renders without re-routing. One function is what
 * keeps a 404 in the language of the URL that produced it.
 */
export function localeFromPath(pathname: string): PathLocale {
  const match = pathname.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)(?:\/(.*))?$/)

  // A segment shaped like a locale but not one the CMS defines is a normal
  // path segment, not a locale. `/status/` must reach the Pages route, not
  // become locale `st`. An unknown code then 404s naturally, through the
  // route it really matched.
  if (match && isLocale(match[1])) {
    return {
      locale: match[1],
      pathWithoutLocale: match[2] ? `/${match[2]}` : '/index',
      prefixed: true,
    }
  }

  return {
    locale: DEFAULT_LOCALE,
    pathWithoutLocale: pathname === '/' ? '/index' : pathname,
    prefixed: false,
  }
}

/** Whether a path is the router's own `/index` spelling of a home page. */
export function isIndexPath(pathname: string): boolean {
  return /^\/index\/?$/.test(pathname)
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
 * The path a locale serves an already-normalized path at.
 *
 * English is served bare, because `+onBeforeRoute` 301s `/en/x` to `/x`.
 * Advertising `/en/x` would advertise a redirect, which is the one thing a
 * canonical must never be.
 */
export function localePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) {
    return path
  }

  // `/fr` rather than `/fr/`: `+onBeforeRoute`'s pattern matches a bare
  // prefix and resolves it to the home page.
  return path === '/' ? `/${locale}` : `/${locale}${path}`
}

/**
 * The absolute URL a locale serves an already-normalized path at.
 *
 * Pass a path from `normalizeContentPath`. This does not re-normalize: it
 * runs once per locale, and the path is the same on every one of them.
 */
export function localeUrl(origin: string, locale: Locale, path: string): string {
  return `${origin}${localePath(locale, path)}`
}
