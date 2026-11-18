/**
 * Pure builders for `/sitemap.xml` and `/robots.txt`.
 *
 * This file has no I/O, so the awkward parts (escaping, and the decision
 * about whether an origin should be indexed at all) stay unit-testable
 * without a request. The reads and the Hono wiring live in
 * `sitemap-routes.ts`.
 */

import type { Alternate } from '../lib/hreflang'

/** One `<url>` entry. */
export interface SitemapUrl {
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
 * Hosts that must never be indexed: the Cloudflare preview deployments and
 * local development.
 *
 * Every PR builds a preview Worker and a preview Ladle site on these
 * domains. A preview that invites crawlers competes with production for
 * the same content, and can outrank it. So this rule works as an
 * allowlist by exclusion, applied to whatever host actually served the
 * request, not to a build-time guess.
 *
 * Both loopback spellings are listed beside `localhost`, because a dev
 * server reached at either one is the same machine. `URL` keeps an IPv6
 * host's brackets, so `[::1]` is the literal to match.
 *
 * shortcut: a LAN address still reads as the real site, so a dev server
 * bound with `--host` and opened at `192.168.x.x` counts its pageviews.
 * Exclude the private ranges if anyone starts developing that way.
 */
const NON_CANONICAL_HOST =
  /(\.workers\.dev|\.pages\.dev)$|^localhost$|^127\.0\.0\.1$|^\[::1\]$|^0\.0\.0\.0$/

/**
 * Whether this origin is the real site, and so may be crawled and counted.
 *
 * Takes an origin rather than a host because every caller has one: the two
 * routes below read it off the request, and the analytics tag in
 * `pages/+Head.tsx` reads it off `pageContext`. A host-level predicate made
 * each of them spell the same parse.
 */
export function isIndexableOrigin(origin: string): boolean {
  try {
    return !NON_CANONICAL_HOST.test(new URL(origin).hostname)
  } catch {
    // Every other URL predicate here wraps its parse, and this is the one
    // on a render path. "Not the real site" is also the honest answer for a
    // string no origin could be: no crawling, no sitemap, no pageview.
    return false
  }
}

/**
 * `robots.txt` for an origin.
 *
 * A preview or local origin refuses everything. The real site allows
 * everything, and points at its sitemap. The sitemap reference is
 * absolute, because `robots.txt` requires it.
 */
export function buildRobotsTxt(origin: string): string {
  if (!isIndexableOrigin(origin)) {
    return ['User-agent: *', 'Disallow: /', ''].join('\n')
  }

  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n')
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
 * two sources is a validation warning, not a harmless repeat.
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
    if (!url.loc || seen.has(url.loc)) {
      continue
    }
    seen.add(url.loc)

    const lastmod = url.lastmod ? `<lastmod>${xmlEscape(url.lastmod)}</lastmod>` : ''
    const alternates = (url.alternates ?? [])
      .map(
        (alternate) =>
          `<xhtml:link rel="alternate" hreflang="${xmlEscape(alternate.hreflang)}" href="${xmlEscape(alternate.href)}"/>`,
      )
      .join('')

    entries.push(`<url><loc>${xmlEscape(url.loc)}</loc>${lastmod}${alternates}</url>`)
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n')
}
