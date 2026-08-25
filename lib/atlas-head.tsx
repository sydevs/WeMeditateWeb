/**
 * `<head>` tags for an atlas page, from the SEO document the C3 endpoint serves.
 *
 * The split this whole feature rests on: **the server owns the `<head>`, the
 * widget owns the body.** The widget is built never to write to a host's head,
 * so these tags are the only thing a crawler or a social scraper ever sees —
 * they have to be right in the server-rendered document, not after hydration.
 *
 * Everything here comes from the endpoint. In particular the canonical is the
 * document's own `webUrl`, **read and never recomputed**: the ownership walk
 * that produces it lives upstream, and a second implementation here would be
 * free to disagree with the first — publishing a canonical that points at a URL
 * which doesn't restore the view is precisely the failure canonicals exist to
 * prevent.
 */

import { useConfig } from 'vike-react/useConfig'
import type { AtlasSeoResponse } from '../server/atlas-types'

/**
 * Open Graph properties vike-react already emits from `title` / `description` /
 * `image`, which we therefore must not emit a second time.
 *
 * `og:image` is passed to the config instead of rendered here because doing so
 * also gets `twitter:card` for free; `og:image:alt` has no config equivalent and
 * is rendered below.
 */
const OG_EMITTED_BY_CONFIG: ReadonlySet<string> = new Set([
  'og:title',
  'og:description',
  'og:image',
])

/**
 * Whether a pre-serialized JSON-LD string is safe to emit verbatim.
 *
 * Upstream's `jsonLdEscape()` already neutralises `</script>` and `<!--` using
 * JSON escapes that round-trip to the same characters, which is why this is
 * emitted with `dangerouslySetInnerHTML` rather than re-escaped — HTML-escaping
 * a JSON string would corrupt it, and `JSON.parse`/`stringify` would drop the
 * escaping that makes it safe.
 *
 * This is the belt to that braces. The sink is a `<script>` block on our own
 * page carrying CMS-authored text, so an upstream regression would be an XSS
 * here rather than upstream. Fail **closed** — drop the block, keeping the page
 * correct and merely less richly described — rather than trying to repair the
 * string, which would silently emit invalid JSON-LD.
 */
export function isSafeJsonLd(jsonLd: string): boolean {
  return jsonLd.length > 0 && !/<\/script|<!--/i.test(jsonLd)
}

/**
 * The head tags an atlas page contributes: canonical, the hreflang cluster,
 * Open Graph, and the JSON-LD block.
 *
 * Rendered as a component (rather than assembled as strings) so React does the
 * ordinary attribute escaping on every value.
 */
export function AtlasHeadTags({ seo }: { seo: AtlasSeoResponse }) {
  return (
    <>
      {seo.canonical && <link rel="canonical" href={seo.canonical} />}

      {/* One row per enabled atlas locale, plus x-default. The canonical is
          locale-free by design — nothing in the atlas is translated, so the
          locales differ only in the widget's UI language, which the endpoint
          carries as `?locale=`. */}
      {seo.alternates.map((alternate) => (
        // The lowercase spelling is spread in deliberately: React emits the
        // `hrefLang` prop as authored, and while an HTML parser lowercases
        // attribute names anyway, these tags exist to be read by other people's
        // crawlers — some of which pattern-match rather than parse.
        <link
          key={alternate.hreflang}
          rel="alternate"
          {...{ hreflang: alternate.hreflang }}
          href={alternate.href}
        />
      ))}

      {Object.entries(seo.openGraph)
        .filter(([property]) => !OG_EMITTED_BY_CONFIG.has(property))
        .map(([property, content]) => (
          <meta key={property} property={property} content={content} />
        ))}

      {isSafeJsonLd(seo.jsonLd) && (
        <script
          type="application/ld+json"
          // Emitted verbatim: see `isSafeJsonLd` for why this is neither
          // re-escaped nor re-serialized.
          dangerouslySetInnerHTML={{ __html: seo.jsonLd }}
        />
      )}
    </>
  )
}

/**
 * Set an atlas page's head during render.
 *
 * Must be called unconditionally from a component — it's a hook. `seo` is `null`
 * for the atlas landing page and for any route whose document we couldn't read,
 * in which case the global defaults apply and we contribute nothing: a guessed
 * canonical is worse than none.
 */
export function useAtlasHead(seo: AtlasSeoResponse | null): void {
  const config = useConfig()

  if (!seo) {
    return
  }

  const image = seo.openGraph['og:image']

  config({
    title: seo.title,
    ...(seo.description ? { description: seo.description } : {}),
    ...(image ? { image } : {}),
    Head: <AtlasHeadTags seo={seo} />,
  })
}
