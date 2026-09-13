/**
 * The one derivation of a content URL's `hreflang` cluster.
 *
 * Both the page `<head>` (`lib/head.tsx`) and `/sitemap.xml`
 * (`server/sitemap-routes.ts`) annotate the same URLs, so they must agree
 * on which locales a document advertises and on how each alternate URL is
 * spelled. Two implementations would be free to disagree, and a cluster
 * whose members contradict each other is one Google discards outright.
 *
 * Nothing here does I/O: the caller brings the per-locale `_status` map and
 * the site's locale set.
 *
 * ## The URL shape needs no derivation of its own
 *
 * `pages/+onBeforeRoute.ts` matches `/{locale}/{path}` and 301s `/en/x` to
 * `/x`, so English is served bare and every other locale is served under
 * its own prefix. A page's slug is not localized (`slugField` on the CMS
 * `pages` collection takes no `localized`), and meditations and lectures
 * are addressed by numeric id, so an alternate is a string operation on a
 * path the caller already holds — never a second read.
 */

import type { Locale } from '../server/cms-types'
import { DEFAULT_LOCALE, isLocale } from '../server/cms-types'

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
 * Payload's per-locale publish state, as `?locale=all&select[_status]=true`
 * returns it: `{ en: 'published', de: 'draft' }`.
 *
 * A locale the document has never been saved in is **absent**, not
 * `'draft'` — Payload returns one row per `_locales` row and nothing for
 * the rest. Only `pages` (and `app-cards`) opt into
 * `versions.drafts.localizeStatus` upstream (SahajCloud#718), so every
 * other collection returns a plain string here, and `advertisedLocales`
 * treats that as "this collection makes no per-locale claim".
 */
export type LocaleStatusMap = Partial<Record<Locale, 'draft' | 'published'>>

/**
 * The locale-free path, in the spelling the URL builders below expect.
 *
 * `+onBeforeRoute` rewrites `/` to `/index` before routing, and
 * `pageContext.urlPathname` carries that spelling through to the render.
 * `/index` is not a URL anyone should be pointed at, so it collapses back
 * to `/` here — the same normalisation `layouts/LayoutChrome.tsx` does for
 * the language dropdown.
 */
export function normalizeContentPath(pathname: string | null | undefined): string {
  if (!pathname || pathname === '/' || pathname === '/index') {
    return '/'
  }

  const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`
  // A trailing slash makes `/about/` and `/about` two URLs claiming to be
  // each other's canonical.
  const trimmed = withLeadingSlash.replace(/\/+$/, '')

  return trimmed === '' ? '/' : trimmed
}

/**
 * The absolute URL a locale serves a locale-free path at.
 *
 * English is served bare, because `+onBeforeRoute` 301s `/en/x` to `/x`.
 * Advertising `/en/x` would advertise a redirect, which is the one thing a
 * canonical must never be.
 */
export function localeUrl(origin: string, locale: Locale, path: string): string {
  const normalized = normalizeContentPath(path)

  if (locale === DEFAULT_LOCALE) {
    return `${origin}${normalized}`
  }

  // `/fr` rather than `/fr/`: `+onBeforeRoute`'s pattern matches a bare
  // prefix and resolves it to the home page.
  return normalized === '/' ? `${origin}/${locale}` : `${origin}/${locale}${normalized}`
}

/**
 * The locales one document may advertise: published in the CMS **and**
 * offered by the site.
 *
 * Both halves are load-bearing, and for different reasons:
 *
 * - **Published.** Payload's locale fallback returns English text for an
 *   untranslated page, so the site would happily render `/fr/x` for a page
 *   nobody has translated. Advertising `fr` there declares a translation
 *   that does not exist, and Google drops the whole cluster.
 * - **Offered.** `server/site-context.ts` 404s a locale outside
 *   `availableLocales`. A locale published in the CMS but switched off for
 *   this site has no URL to point at.
 *
 * A collection that does not opt into per-locale status returns `_status`
 * as a plain string (meditations) or omits it (lectures). There is no
 * per-document translation claim to make, so the answer is an empty list
 * and the caller emits a canonical with no cluster.
 *
 * The result follows `offered`'s order, so the emitted rows are stable.
 */
export function advertisedLocales(status: unknown, offered: readonly Locale[]): Locale[] {
  if (!status || typeof status !== 'object' || Array.isArray(status)) {
    return []
  }

  const map = status as Record<string, unknown>

  return offered.filter((locale) => isLocale(locale) && map[locale] === 'published')
}

/**
 * The cluster for one URL: a row per advertised locale, plus `x-default`.
 *
 * Every member points at the same cluster, so the annotation is reciprocal
 * without any member needing to know it is the one being rendered.
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
  const { origin, path, locales } = options

  if (locales.length === 0) {
    return []
  }

  const alternates: Alternate[] = locales.map((locale) => ({
    hreflang: locale,
    href: localeUrl(origin, locale, path),
  }))

  if (locales.includes(DEFAULT_LOCALE)) {
    alternates.push({ hreflang: X_DEFAULT, href: localeUrl(origin, DEFAULT_LOCALE, path) })
  }

  return alternates
}
