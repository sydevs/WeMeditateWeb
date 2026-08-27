/**
 * Pure builders for `/sitemap.xml` and `/robots.txt`.
 *
 * Kept free of I/O so the awkward parts — escaping, and the decision about
 * whether an origin should be indexed at all — are unit-testable without a
 * request. The reads and the Hono wiring live in `sitemap-routes.ts`.
 */

/** One `<url>` entry. */
export interface SitemapUrl {
  loc: string
  /** ISO 8601 timestamp, omitted when the source has none. */
  lastmod?: string | null
}

/**
 * Escape a string for XML text content.
 *
 * A sitemap carries CMS-derived URLs, and a slug or a query string containing
 * `&` produces a document no parser will accept — a silently *empty* sitemap
 * rather than a loud failure, which is the worst kind. The five predefined
 * entities are all XML has.
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
 * Every PR builds a preview Worker and a preview Ladle site on these domains. A
 * preview that invites crawlers competes with production for the same content
 * and can outrank it — so the rule is an allowlist by exclusion, applied to
 * whatever host actually served the request rather than to a build-time guess.
 */
const NON_CANONICAL_HOST = /(\.workers\.dev|\.pages\.dev)$|^localhost$|^127\.0\.0\.1$/

/** Whether this host is the real site, and so may be crawled. */
export function isIndexableHost(hostname: string): boolean {
  return !NON_CANONICAL_HOST.test(hostname)
}

/**
 * `robots.txt` for an origin.
 *
 * A preview or local origin refuses everything; the real site allows everything
 * and points at its sitemap. The sitemap reference is absolute because
 * `robots.txt` requires it to be.
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
 * One file, no index and no pagination: the whole surface — pages, meditations,
 * lectures and the atlas — is a few thousand URLs, comfortably inside the
 * 50,000-URL / 50 MB limits a single sitemap allows.
 *
 * Duplicates are collapsed, because the same URL arriving from two sources is a
 * validation warning rather than a harmless repeat.
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
