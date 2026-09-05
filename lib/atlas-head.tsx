/**
 * `<head>` tags for an atlas page, from the SEO document the C3 endpoint serves.
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
 */

import { useConfig } from 'vike-react/useConfig'
import type { AtlasSeoResponse } from '../server/atlas-types'

/**
 * Open Graph properties vike-react already emits from `title`,
 * `description`, and `image`. This module must not emit them a second
 * time.
 *
 * `og:image` is passed to the config, instead of rendered here, because
 * that also gets `twitter:card` for free. `og:image:alt` has no config
 * equivalent, and is rendered below.
 */
const OG_EMITTED_BY_CONFIG: ReadonlySet<string> = new Set([
  'og:title',
  'og:description',
  'og:image',
])

/**
 * Whether a pre-serialized JSON-LD string is safe to emit verbatim.
 *
 * Upstream's `jsonLdEscape()` already neutralizes `</script>` and `<!--`,
 * with JSON escapes that round-trip to the same characters. This is why
 * this string is emitted with `dangerouslySetInnerHTML`, instead of
 * re-escaped. HTML-escaping a JSON string would corrupt it, and running
 * it through `JSON.parse` and `stringify` would drop the escaping that
 * makes it safe.
 *
 * This check is the belt to that braces. The sink is a `<script>` block
 * on this page, carrying CMS-authored text, so an upstream regression
 * would become an XSS here. Fail closed: drop the block, keeping the
 * page correct but less richly described, instead of trying to repair
 * the string, which would silently emit invalid JSON-LD.
 */
export function isSafeJsonLd(jsonLd: string): boolean {
  return jsonLd.length > 0 && !/<\/script|<!--/i.test(jsonLd)
}

/**
 * The head tags an atlas page contributes: canonical, the hreflang cluster,
 * Open Graph, and the JSON-LD block.
 *
 * Rendered as a component, instead of assembled as strings, so React does
 * the ordinary attribute escaping on every value.
 */
export function AtlasHeadTags({ seo }: { seo: AtlasSeoResponse }) {
  return (
    <>
      {seo.canonical && <link href={seo.canonical} rel="canonical" />}

      {/* One row per enabled atlas locale, plus x-default. The canonical
          is locale-free by design. Nothing in the atlas is translated, so
          the locales differ only in the widget's UI language, which the
          endpoint carries as `?locale=`. */}
      {seo.alternates.map((alternate) => (
        // The lowercase spelling is spread in deliberately. React emits
        // the `hrefLang` prop as authored, and while an HTML parser
        // lowercases attribute names anyway, these tags exist for other
        // crawlers to read, and some of them pattern-match instead of
        // parsing.
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
          <meta key={property} content={content} property={property} />
        ))}

      {isSafeJsonLd(seo.jsonLd) && (
        // Emitted verbatim: see `isSafeJsonLd` for why this is neither
        // re-escaped nor re-serialized.
        <script dangerouslySetInnerHTML={{ __html: seo.jsonLd }} type="application/ld+json" />
      )}
    </>
  )
}

/**
 * Sets an atlas page's head during render.
 *
 * This is a hook, so call it unconditionally from a component. `seo` is
 * `null` for the atlas landing page, and for any route whose document
 * this function could not read. In that case the global defaults apply,
 * and this function contributes nothing: a guessed canonical is worse
 * than none.
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
    // ⚠ An array, even for one element. `Head` is a cumulative config,
    // and vike-react spreads it at render time
    // (`...pageContext._configViaHook?.Head ?? []` in its `getHeadHtml`).
    // A bare element throws `((intermediate value) ?? []) is not
    // iterable` and 500s the page. Its own types do not say so:
    // `ConfigViaHook` picks `Head` from `Vike.Config`, where it is
    // singular, so the compiler accepts the broken form. Verified against
    // vike-react@0.6.19.
    Head: [<AtlasHeadTags key="atlas-head" seo={seo} />],
  })
}
