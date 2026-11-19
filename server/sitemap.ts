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
 * Hosts that must never be indexed or counted: the Cloudflare preview
 * deployments, and every address a development machine answers on.
 *
 * Every PR builds a preview Worker and a preview Ladle site on these
 * domains. A preview that invites crawlers competes with production for
 * the same content, and can outrank it. So this rule works as an
 * allowlist by exclusion, applied to whatever host actually served the
 * request, not to a build-time guess.
 *
 * The private ranges count as development too: `vite --host` serves the LAN
 * address as well as the `localhost` it prints, and that is the one a
 * developer opens on a phone. Each is matched as a whole dotted quad, so a
 * public host named `10.wemeditate.com` stays the real site. `URL` keeps an
 * IPv6 host's brackets, so `[::1]` is the literal to match.
 *
 * shortcut: a dev machine reached at a spelling outside these ranges still
 * reads as the real site — a Tailscale `100.64/10` address, a `*.localhost`
 * subdomain, link-local `169.254/16`, or the IPv4-mapped `[::ffff:7f00:1]`,
 * which `URL` does not fold to `127.0.0.1`. Add the spelling if anyone here
 * starts developing that way.
 */
const NON_CANONICAL_HOSTS = [
  /(\.workers\.dev|\.pages\.dev)$/,
  /^localhost$|^\[::1\]$|^0\.0\.0\.0$/,
  /^127(\.\d{1,3}){3}$/,
  /^10(\.\d{1,3}){3}$/,
  /^192\.168(\.\d{1,3}){2}$/,
  /^172\.(1[6-9]|2\d|3[01])(\.\d{1,3}){2}$/,
]

/**
 * Whether this origin is the real site, and so may be crawled and counted.
 *
 * Takes an origin rather than a host because every caller has one: the two
 * routes below read it off the request, and the analytics tag in
 * `pages/+Head.tsx` reads it off `pageContext`. A host-level predicate made
 * each of them spell the same parse.
 */
export function isCanonicalOrigin(origin: string): boolean {
  const { hostname } = new URL(origin)

  return !NON_CANONICAL_HOSTS.some((pattern) => pattern.test(hostname))
}

/**
 * `robots.txt` for an origin.
 *
 * A preview or local origin refuses everything. The real site allows
 * everything, and points at its sitemap. The sitemap reference is
 * absolute, because `robots.txt` requires it.
 */
export function buildRobotsTxt(origin: string): string {
  if (!isCanonicalOrigin(origin)) {
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
