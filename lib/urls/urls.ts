/**
 * How this site spells a URL: which locale a path is served in, the
 * locale-free path, and the absolute URL a given locale serves that path at.
 *
 * These rules belong to routing, not to any one consumer. `+onBeforeRoute`
 * creates the `/index` spelling and 301s `/en/x` to `/x`, out of the same
 * derivation the read side inverts here. The language dropdown
 * (`layouts/LayoutChrome.tsx`), the canonical (`lib/seo/head.tsx`) and the
 * `hreflang` cluster (`lib/seo/hreflang.ts`) all need the same answer, so they
 * read it from here rather than each restating the routing rule.
 *
 * Nothing here does I/O. A path is a string operation on a path the caller
 * already holds.
 */

import type { Locale } from '@/types/sahajcloud'
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/locales'

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

/** Where a path stops and a slash becomes content rather than a separator. */
const HAS_QUERY_OR_HASH = /[?#]/

/**
 * The locale a path is served in, and the path underneath it.
 *
 * `+onBeforeRoute` reads it on the nominal path and `+onCreatePageContext` on
 * the error page, which Vike renders without re-routing. One function is what
 * keeps a 404 in the language of the URL that produced it.
 */
export function localeFromPath(pathname: string): PathLocale {
  const match = pathname.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)(?:\/(.*))?$/)

  // A segment shaped like a locale but not one SahajCloud defines is a normal
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
 * ⚠ **A gate on a URL this site did not author itself**, and the strictest of
 * the three: it admits nothing but http(s), so a configured `javascript:` or
 * `data:` value cannot run in our origin. Reach for it where the URL must be
 * absolute — an `href` takes {@link isSafeLinkHref} instead. Four callers
 * need it today: the status-page link (`ErrorFallback`), an authored form's
 * redirect (`FormBuilder`, through {@link isSafeNavigationUrl}), which reaches
 * `window.location.href` on a successful submission, the joining link of the
 * class a `countdown` splash names (`LiveSession`), and everything the atlas
 * sends — a region's canonical and a class's own room or website link
 * (`pages/map/_components/AtlasContent.tsx`).
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
 * send a visitor to another site, so an off-site URL passes — but by its own
 * spelling. {@link isSitePath} decides what counts as a path here, so
 * `//host` is read as the origin it names rather than as a path, and
 * {@link isSafeLinkHref} cannot answer the same string differently.
 *
 * `/\host`, which browsers fold to `//host`, still reads as a path. That is
 * {@link isSitePath}'s limit, not a second view of one here.
 */
export function isSafeNavigationUrl(url: string): boolean {
  return isSitePath(url) || isSafeHttpUrl(url)
}

/** The schemes a link on this site may carry. */
const LINK_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:'])

/**
 * True if the href is one the `Link` atom may render.
 *
 * ⚠ **The gate on every href the site did not author**, and the widest of the
 * three: an editor's link legitimately spells a site path, a bare `#anchor`,
 * `mailto:` or `tel:`, all of which {@link isSafeHttpUrl} and
 * {@link isSafeNavigationUrl} reject. `Link` is where every such href
 * converges, so this is what keeps a configured `javascript:` or `data:` value
 * out of an `href` in our origin.
 *
 * A scheme is the whole test. Where the link goes is the editor's business,
 * as on {@link isSafeNavigationUrl}.
 *
 * Two spellings fall outside the allowlist on purpose. A protocol-relative
 * `//host` names another origin and inherits our scheme; the plain `https://`
 * spelling of the same destination is already allowed. And an empty href
 * reloads the current page, which is never what an unset SahajCloud field
 * meant.
 */
export function isSafeLinkHref(href: string): boolean {
  if (href.startsWith('#') || isSitePath(href)) {
    return true
  }

  // Refused ahead of the parse because `new URL` answers both by throwing, and
  // a caught `TypeError` carries a captured stack trace — some twenty times
  // the cost of rendering the whole link. An unset SahajCloud field arrives
  // here as `''`, which `Playlist` and `AudioPlayer` hand over per track.
  if (href === '' || href.startsWith('//')) {
    return false
  }

  try {
    return LINK_SCHEMES.has(new URL(href).protocol)
  } catch {
    return false
  }
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
 * The path underneath an absolute URL, when that URL is on this origin.
 *
 * A caller holding a URL it did not build — an upstream canonical, most of
 * all — gets back either a path it may locale-prefix or `null`, and never
 * compares origins itself. `null` covers an unknown `origin` too, which is
 * the case outside a Vike app.
 *
 * The path comes back in `normalizeContentPath`'s spelling, so it meets
 * {@link localePath}'s precondition whether or not the caller reaches it
 * through {@link localeHref}. The query and fragment survive: they name a
 * different document, not a respelling.
 */
export function sitePathFromUrl(url: string, origin: string | null | undefined): string | null {
  if (!origin) {
    return null
  }

  try {
    const parsed = new URL(url)

    // {@link isSafeHttpUrl}'s test, on the URL already parsed. Comparing
    // origins would reject another scheme anyway, but only incidentally,
    // and this is not a gate to leave resting on an accident.
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null
    }

    if (parsed.origin !== origin) {
      return null
    }

    const path = `${normalizeContentPath(parsed.pathname)}${parsed.search}${parsed.hash}`

    // ⚠ `https://wemeditate.com//evil.com` is same-origin yet reads as a
    // host, and every caller hands this result to something trusting a path.
    return isSitePath(path) ? path : null
  } catch {
    return null
  }
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
 * {@link localeHref} instead.
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
 * The absolute URL for an href a component or an editor wrote — {@link localeUrl}
 * for a caller that cannot promise {@link localePath}'s already-normalized input.
 *
 * The embed snippet, a content-index card's `ItemList` entry and anything else
 * that has to name a page of ours in full read the answer here rather than
 * gluing an origin onto {@link localeHref} themselves.
 *
 * ⚠ Only a path of ours takes the origin. An off-site URL already names its
 * own, and prefixing it would produce `https://ourshttps://theirs`.
 */
export function absoluteHref(origin: string, locale: Locale, href: string): string {
  return isSitePath(href) ? `${origin}${localeHref(locale, href)}` : localeHref(locale, href)
}

/**
 * The href to render for whatever a component or an editor wrote — the one
 * entry point for a caller that cannot promise `localePath`'s
 * already-normalized input.
 *
 * ⚠ **`isSitePath` reads the href as written.** Classify first, transform
 * second: `normalizeContentPath('')` is `/`, so normalizing ahead of the guard
 * would turn an unset href into a link to the home page.
 *
 * Only the path is normalized. A query and a fragment go back on untouched,
 * because a slash inside one is content — `?url=https://example.com/` is a
 * value, not a path that ends in a separator.
 */
export function localeHref(locale: Locale, href: string): string {
  if (!isSitePath(href)) {
    return href
  }

  const suffixAt = href.search(HAS_QUERY_OR_HASH)
  const path = suffixAt === -1 ? href : href.slice(0, suffixAt)
  const suffix = suffixAt === -1 ? '' : href.slice(suffixAt)

  return localePath(locale, normalizeContentPath(path)) + suffix
}
