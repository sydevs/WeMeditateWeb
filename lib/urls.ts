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
  /** Whether the path spelled `/index` itself. Only a request can: a bare root
   * is given that spelling here, and `+onBeforeRoute` 301s a request away. */
  requestedIndex: boolean
}

/** The routing spelling of a home page, which is never a URL. */
const INDEX_PATH = /^\/index\/?$/

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
    const underneath = match[2] ? `/${match[2]}` : ''

    return {
      locale: match[1],
      pathWithoutLocale: underneath || '/index',
      prefixed: true,
      requestedIndex: INDEX_PATH.test(underneath),
    }
  }

  return {
    locale: DEFAULT_LOCALE,
    pathWithoutLocale: pathname === '/' ? '/index' : pathname,
    prefixed: false,
    requestedIndex: INDEX_PATH.test(pathname),
  }
}

/**
 * True if the URL parses and uses an http(s) scheme.
 *
 * ⚠ **The gate on any URL this site did not author itself**, and the only
 * thing standing between a configured value and `javascript:` or `data:`
 * running in our origin. Two values need it today: the status-page link
 * (`ErrorFallback`) and an authored form's redirect (`lib/submissions.ts`),
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
  if (!pathname || INDEX_PATH.test(pathname)) {
    return '/'
  }

  return pathname.replace(/\/+$/, '') || '/'
}

/**
 * Whether an href is a path on this site, and so ours to locale-prefix.
 *
 * A protocol-relative `//cdn.example.com` is another origin despite the
 * leading slash, and `mailto:`, `tel:` and a bare relative `about` are not
 * paths at all. Every one of them becomes nonsense with a locale glued on.
 */
export function isSitePath(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//')
}

/**
 * The path a locale serves an already-normalized path at, origin-relative.
 *
 * English is served bare, because `+onBeforeRoute` 301s `/en/x` to `/x`.
 * Advertising `/en/x` would advertise a redirect, which is the one thing a
 * canonical must never be.
 *
 * Pass a path from `normalizeContentPath`. This does not re-normalize, and it
 * prefixes whatever it is given, so a caller holding arbitrary hrefs calls
 * {@link sitePath} instead.
 */
export function localePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) {
    return path
  }

  // `/fr` rather than `/fr/`: `+onBeforeRoute`'s pattern matches a bare
  // prefix and resolves it to the home page.
  return path === '/' ? `/${locale}` : `/${locale}${path}`
}

/** The absolute URL a locale serves an already-normalized path at. */
export function localeUrl(origin: string, locale: Locale, path: string): string {
  return `${origin}${localePath(locale, path)}`
}

/**
 * The path this site serves, for an href a component or an editor wrote —
 * the one entry point for a caller that cannot promise `localePath`'s
 * already-normalized input.
 *
 * ⚠ **The predicate runs on the href as written.** Classify first, transform
 * second: `normalizeContentPath('')` is `/`, so normalizing ahead of the guard
 * would turn an unset href into a link to the home page.
 *
 * A trailing slash before a `?` or a `#` survives, because
 * `normalizeContentPath` strips only a final slash.
 */
export function sitePath(locale: Locale, href: string): string {
  return isSitePath(href) ? localePath(locale, normalizeContentPath(href)) : href
}
