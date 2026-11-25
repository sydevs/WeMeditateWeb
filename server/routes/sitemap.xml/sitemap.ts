/**
 * Pure builders for `/sitemap.xml`.
 *
 * This file has no I/O, so the awkward part (escaping) stays unit-testable
 * without a request. The reads and the Hono wiring live in `route.ts`.
 */

import type { Alternate } from '@/lib/seo/hreflang'

/** One `<url>` entry. */
export interface SitemapUrl {
  /**
   * The absolute URL, percent-encoded by whoever built it — `localeUrl` for a
   * content row, upstream's own `webUrl` for an atlas one. Nothing here
   * respells a URL, so a raw native-letter `<loc>` is a producer's bug.
   */
  loc: string
  /** ISO 8601 timestamp, omitted when the source has none. */
  lastmod?: string | null
  /**
   * The URL's `hreflang` cluster, as `xhtml:link` children.
   *
   * Built by `buildAlternates`, the same function the page `<head>` uses,
   * so the two annotations of one URL cannot disagree. Omitted or empty
   * means the document advertises no translations.
   */
  alternates?: readonly Alternate[]
}

/**
 * Escapes a string for XML text content.
 *
 * A sitemap carries SahajCloud-derived URLs. A slug or query string with an `&`
 * produces a document no parser accepts. That fails silently, as an empty
 * sitemap, instead of loudly. This is the worst kind of failure. The five
 * predefined entities are all XML has.
 */
export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * A sitemap document.
 *
 * One file, with no index and no pagination. The whole surface, pages,
 * meditations, lectures, and the atlas, is a few thousand URLs. This
 * comfortably fits inside the limits a single sitemap allows: 50,000 URLs
 * and 50 MB.
 *
 * This function collapses duplicates, because the same URL arriving from
 * two sources is a validation warning, not a harmless repeat. Both halves
 * arrive in one spelling, so two rows for one document compare equal.
 *
 * ⚠ The `xhtml` namespace is declared on `<urlset>` unconditionally, not
 * only when an entry carries alternates. An `xhtml:link` child under an
 * undeclared prefix makes the whole document invalid, and Search Console
 * then rejects every URL in it — the same silent, total failure `xmlEscape`
 * exists to prevent. Declaring it always costs one attribute and removes
 * the ordering hazard entirely.
 */
export function buildSitemapXml(urls: SitemapUrl[]): string {
  const seen = new Set<string>()
  const entries: string[] = []

  for (const url of urls) {
    const loc = url.loc

    if (!loc || seen.has(loc)) {
      continue
    }
    seen.add(loc)

    const lastmod = url.lastmod ? `<lastmod>${xmlEscape(url.lastmod)}</lastmod>` : ''
    const alternates = (url.alternates ?? [])
      .map(
        (alternate) =>
          `<xhtml:link rel="alternate" hreflang="${xmlEscape(alternate.hreflang)}" href="${xmlEscape(alternate.href)}"/>`,
      )
      .join('')

    entries.push(`<url><loc>${xmlEscape(loc)}</loc>${lastmod}${alternates}</url>`)
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n')
}
