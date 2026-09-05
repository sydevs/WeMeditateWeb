/**
 * Pure builders for `/sitemap.xml` and `/robots.txt`.
 *
 * This file has no I/O, so the awkward parts (escaping, and the decision
 * about whether an origin should be indexed at all) stay unit-testable
 * without a request. The reads and the Hono wiring live in
 * `sitemap-routes.ts`.
 */

/** One `<url>` entry. */
export interface SitemapUrl {
  loc: string
  /** ISO 8601 timestamp, omitted when the source has none. */
  lastmod?: string | null
}

/**
 * Escapes a string for XML text content.
 *
 * A sitemap carries CMS-derived URLs. A slug or query string with an `&`
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
 */
const NON_CANONICAL_HOST = /(\.workers\.dev|\.pages\.dev)$|^localhost$|^127\.0\.0\.1$/

/** Whether this host is the real site, and so may be crawled. */
export function isIndexableHost(hostname: string): boolean {
  return !NON_CANONICAL_HOST.test(hostname)
}

/**
 * `robots.txt` for an origin.
 *
 * A preview or local origin refuses everything. The real site allows
 * everything, and points at its sitemap. The sitemap reference is
 * absolute, because `robots.txt` requires it.
 */
export function buildRobotsTxt(origin: string): string {
  const { hostname } = new URL(origin)

  if (!isIndexableHost(hostname)) {
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

    entries.push(`<url><loc>${xmlEscape(url.loc)}</loc>${lastmod}</url>`)
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n')
}
