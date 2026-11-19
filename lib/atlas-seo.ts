/**
 * The `<head>` an atlas page publishes, from the SEO document the C3
 * endpoint serves.
 *
 * The split this whole feature rests on: the server owns the `<head>`, the
 * widget owns the body. The widget is built to never write to a host's
 * head, so these tags are the only thing a crawler or a social scraper
 * ever sees. They must be right in the server-rendered document, not
 * after hydration.
 *
 * Everything here comes from the endpoint. In particular, the canonical
 * is the document's own `webUrl`, read and never recomputed. The
 * ownership walk that produces it lives upstream, and a second
 * implementation here would be free to disagree with the first.
 * Publishing a canonical that points at a URL that does not restore the
 * view is exactly the failure canonicals exist to prevent.
 *
 * This module only adapts that answer to the {@link SeoDocument} every
 * other route builds locally (`lib/content-seo.ts`), so one generator
 * renders every head on the site (`lib/seo-head-html.ts`). Its `@graph`
 * arrives already serialized, which is the one way this document differs
 * from a content route's.
 */

import type { AtlasSeoResponse } from '../server/atlas-types'
import { isCanonicalOrigin } from '../server/sitemap'
import type { SeoDocument } from './head'

/**
 * Open Graph properties vike-react emits from the `title` and `description`
 * settings. The endpoint sends them in `openGraph` as well, so they are
 * dropped here rather than rendered twice.
 */
const OG_EMITTED_BY_CONFIG: ReadonlySet<string> = new Set(['og:title', 'og:description'])

/** The atlas answer as the document the generator renders. */
export function atlasSeo(seo: AtlasSeoResponse, origin: string | null): SeoDocument {
  const meta: [string, string][] = Object.entries(seo.openGraph).filter(
    ([property]) => !OG_EMITTED_BY_CONFIG.has(property),
  )

  // `twitter:card` rides the image, as it does on a content route. vike-react
  // used to emit it from the `image` setting, which this document replaced.
  if (seo.openGraph['og:image']) {
    meta.push(['twitter:card', 'summary_large_image'])
  }

  // The same claim every other route makes: only the real site may be
  // indexed, and there a share image may be shown at full size.
  meta.push(['robots', origin && isCanonicalOrigin(origin) ? 'max-image-preview:large' : 'noindex'])

  return {
    title: seo.title,
    description: seo.description,
    canonical: seo.canonical,
    // One row per enabled atlas locale, plus x-default. The canonical is
    // locale-free by design. Nothing in the atlas is translated, so the
    // locales differ only in the widget's UI language, which the endpoint
    // carries as `?locale=` — unlike a content page's cluster, whose members
    // are path prefixes. The two clusters must not be merged.
    alternates: seo.alternates,
    meta,
    jsonLd: seo.jsonLd,
  }
}
