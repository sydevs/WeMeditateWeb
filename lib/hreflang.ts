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
 *
 * How a URL is spelled is not this module's business. `lib/urls.ts` owns
 * that, because the language dropdown and the canonical need the same rule
 * and neither has anything to do with `hreflang`.
 */

import type { Locale } from '../server/content-types'
import { DEFAULT_LOCALE } from '../server/content-types'
import { localeUrl, normalizeContentPath } from './urls'

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
 * The locales one document may advertise: published in SahajCloud **and**
 * offered by the site.
 *
 * Both halves are load-bearing, and for different reasons:
 *
 * - **Published.** Payload's locale fallback returns English text for an
 *   untranslated page, so advertising a locale the document is not
 *   published in declares a translation that does not exist, and Google
 *   drops the cluster.
 * - **Offered.** `server/site-context.ts` 404s a locale outside
 *   `availableLocales`. A locale published in SahajCloud but switched off for
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
