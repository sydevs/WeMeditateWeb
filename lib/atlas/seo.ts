/**
 * The `<head>` an atlas page publishes, from the SEO document the C3 endpoint
 * serves.
 *
 * The server owns the `<head>` and the widget owns the body: the widget never
 * writes to a host's head, so these tags are all a crawler or a scraper sees.
 *
 * ⚠ **Everything comes from the endpoint, the canonical included.** It is the
 * document's own `webUrl`, never recomputed: the ownership walk that produces
 * it lives upstream, and a second implementation would be free to disagree.
 *
 * This only adapts that answer to the {@link SeoDocument} every other route
 * builds, so one generator renders every head (`lib/seo/head-html.ts`).
 */

import type { AtlasSeoResponse } from '@/types/atlas'
import type { SeoDocument } from '@/lib/seo/head'

/** vike-react emits these from the `title` and `description` settings. */
const OG_EMITTED_BY_CONFIG: ReadonlySet<string> = new Set(['og:title', 'og:description'])

/** The atlas answer as the document the generator renders. */
export function atlasSeo(seo: AtlasSeoResponse): SeoDocument {
  return {
    title: seo.title,
    description: seo.description,
    canonical: seo.canonical,
    // The atlas cluster varies `?locale=`, not a path prefix, so it must never
    // be merged with a content page's.
    alternates: seo.alternates,
    meta: Object.entries(seo.openGraph)
      .filter(([property]) => !OG_EMITTED_BY_CONFIG.has(property))
      .map(([property, content]) => ({ property, content })),
    // A card promising a large image and carrying none renders as an empty box.
    seoMeta: seo.openGraph['og:image'] ? { twitterCard: 'summary_large_image' } : {},
    jsonLd: seo.jsonLd,
  }
}
