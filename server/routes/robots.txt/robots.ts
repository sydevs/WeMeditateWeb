import { isCanonicalOrigin } from '@/lib/seo/canonical-origin'

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
