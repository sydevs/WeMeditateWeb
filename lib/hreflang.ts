/**
 * The one derivation of a content URL's `hreflang` cluster.
 *
 * Both the page `<head>` (`lib/head.tsx`) and `/sitemap.xml`
 * (`server/sitemap-routes.ts`) annotate the same URLs, so they must agree
 * on which locales a document advertises and on how each alternate URL is
 * spelled. Two implementations would be free to disagree, and a cluster
 * whose members contradict each other is one Google discards.
 *
 * Nothing here does I/O: the caller brings the per-locale `_status` map and
 * the site's locale set. A page's slug is not localized upstream, and
 * meditations and lectures are addressed by numeric id, so an alternate is
 * a string operation on a path the caller already holds.
 */

import type { Locale } from '../server/cms-types'
import { DEFAULT_LOCALE } from '../server/cms-types'

/** One `rel="alternate"` row: a language code and the URL it points at. */
export interface Alternate {
  hreflang: string
  href: string
}

/**
 * The row that names the URL a crawler should use when no advertised
 * locale matches the reader.
 */
export const X_DEFAULT = 'x-default'

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

/**
 * The locales one document may advertise: published in the CMS **and**
 * offered by the site.
 *
 * Both halves are load-bearing, and for different reasons:
 *
 * - **Published.** Payload's locale fallback returns English text for an
 *   untranslated page, so advertising a locale the document is not
 *   published in declares a translation that does not exist, and Google
 *   drops the cluster.
 * - **Offered.** `server/site-context.ts` 404s a locale outside
 *   `availableLocales`. A locale published in the CMS but switched off for
 *   this site has no URL to point at.
 *
 * A collection that does not opt into per-locale status returns `_status`
 * as a plain string (meditations) or omits it (lectures). There is no
 * per-document translation claim to make, so the answer is an empty list
 * and the caller emits a canonical with no cluster.
 */
export function advertisedLocales(status: unknown, offered: readonly Locale[]): Locale[] {
  if (!status || typeof status !== 'object' || Array.isArray(status)) {
    return []
  }

  const map = status as Record<string, unknown>

  // Iterating `offered`, rather than the map's own keys, keeps the emitted
  // rows in a stable, editor-controlled order.
  return offered.filter((locale) => map[locale] === 'published')
}

/**
 * The cluster for one URL: a row per advertised locale, plus `x-default`.
 *
 * Every member carries the same cluster, so the annotation is reciprocal
 * without any member needing to know which one it is.
 *
 * `x-default` is the bare English URL, and is emitted **only** when
 * English is advertised. Where it is not, the bare URL 404s
 * (`getPageBySlug` drops a draft), and pointing the fallback at a 404 is
 * worse than having no fallback.
 *
 * An empty locale list yields no rows at all: a canonical alone says
 * "this page has no translations", which is the truth for a document whose
 * collection carries no per-locale publish state.
 */
export function buildAlternates(options: {
  origin: string
  path: string
  locales: readonly Locale[]
}): Alternate[] {
  const { origin, locales } = options

  if (locales.length === 0) {
    return []
  }

  const path = normalizeContentPath(options.path)
  const alternates: Alternate[] = locales.map((locale) => ({
    hreflang: locale,
    href: localeUrl(origin, locale, path),
  }))

  if (locales.includes(DEFAULT_LOCALE)) {
    alternates.push({ hreflang: X_DEFAULT, href: localeUrl(origin, DEFAULT_LOCALE, path) })
  }

  return alternates
}
