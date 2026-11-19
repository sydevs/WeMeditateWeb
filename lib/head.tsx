/**
 * SEO `<head>` rendering, for every route that publishes a URL.
 *
 * There is one head mechanism here, and the work is split the way
 * vike-react splits it:
 *
 * - `title` and `description` are vike-react settings, declared once in
 *   `pages/+config.ts` and composed in `lib/head-settings.ts`, which says
 *   why they cannot live here. Vike turns them into `<title>`, `og:title`,
 *   `description` and `og:description`, and re-applies them on a client-side
 *   navigation, which no `Head` component gets to do.
 * - Everything else — the canonical, the `hreflang` cluster, the rest of
 *   Open Graph, and JSON-LD — is raw head HTML, because `useConfig` emits no
 *   `<link>` and no `<script>`. A content route generates it with Unhead
 *   (`lib/seo-head-html.ts`); `/map` renders the answer SahajCloud serves
 *   through {@link SeoHeadTags} (`lib/atlas-head.tsx`).
 *
 * Both halves read one {@link SeoDocument}, built server-side in the route's
 * `+data.ts` by `lib/content-seo.ts`. A route that builds none — an `embed`
 * route, the error page — serves the site's own title and description and
 * publishes no URL claim at all.
 *
 * See https://vike.dev/useConfig and https://vike.dev/title
 */

import type { Alternate } from './hreflang'
import type { SeoSchema } from './seo-schema'

/** The `<head>` tags a URL contributes beyond vike-react's own settings. */
export interface SeoHead {
  /** The URL's self-referential canonical, or null where it publishes none. */
  canonical: string | null
  alternates: readonly Alternate[]
  /** `[property, content]` pairs — a list, because `og:locale:alternate` repeats. */
  meta: readonly (readonly [string, string])[]
  /**
   * `<link>` tags beyond the canonical and the `hreflang` cluster: today the
   * oEmbed discovery link a media route publishes.
   */
  links?: readonly { rel: string; type: string; href: string }[]
  /** A serialized `application/ld+json` body, or `''` for none. */
  jsonLd: string
  /**
   * The `@graph` as plain data, for a route whose head Unhead generates
   * (`lib/seo-head-html.ts`). Absent on a route still serializing its own
   * {@link jsonLd}; a route sets one or the other, never both.
   */
  schema?: SeoSchema
}

/** A whole head: the two vike-react settings, plus the tags around them. */
export interface SeoDocument extends SeoHead {
  /** The composed `<title>`, which vike-react also emits as `og:title`. */
  title: string
  description: string | null
}

/**
 * Whether a pre-serialized JSON-LD string is safe to emit verbatim.
 *
 * `serializeJsonLd` (lib/structured-data.ts) and SahajCloud's own
 * `jsonLdEscape()` both neutralize `</script>` and `<!--`, with JSON escapes
 * that round-trip to the same characters. This is why the string is emitted
 * with `dangerouslySetInnerHTML` instead of re-escaped. HTML-escaping a JSON
 * string would corrupt it, and running it through `JSON.parse` and
 * `stringify` would drop the escaping that makes it safe.
 *
 * This check is the belt to that braces. The sink is a `<script>` block
 * carrying SahajCloud-authored text, so a regression in either producer would
 * become an XSS here. Fail closed: drop the block, keeping the page correct
 * but less richly described, instead of trying to repair the string, which
 * would silently emit invalid JSON-LD.
 */
export function isSafeJsonLd(jsonLd: string): boolean {
  return jsonLd.length > 0 && !/<\/script|<!--/i.test(jsonLd)
}

/**
 * Whether a meta key belongs to the Open Graph vocabulary, which is the one
 * that keys on `property` rather than `name`.
 *
 * `og:` and `article:` are both Open Graph namespaces; everything else a
 * route publishes — `twitter:*`, `robots`, `apple-itunes-app` — is a plain
 * meta name.
 */
export function isOpenGraphKey(key: string): boolean {
  return key.startsWith('og:') || key.startsWith('article:')
}

/**
 * One `<link rel="alternate" hreflang>` per row of a cluster.
 *
 * The single owner of how an alternate is spelled, used by the content
 * pages here and by `/map`. The two clusters are built very differently —
 * content alternates are path prefixes, atlas alternates are `?locale=`
 * query variants — but they are rendered identically, and a spelling that
 * drifted between them would annotate half the site one way and half the
 * other.
 *
 * Rendered as a component, instead of assembled as strings, so React does
 * the ordinary attribute escaping on every value.
 */
export function HreflangLinks({ alternates }: { alternates: readonly Alternate[] }) {
  return (
    <>
      {alternates.map((alternate) => (
        // The lowercase spelling is spread in deliberately. React emits the
        // `hrefLang` prop as authored, and while an HTML parser lowercases
        // attribute names anyway, these tags exist for other crawlers to
        // read, and some of them pattern-match instead of parsing.
        <link
          key={alternate.hreflang}
          rel="alternate"
          {...{ hreflang: alternate.hreflang }}
          href={alternate.href}
        />
      ))}
    </>
  )
}

/**
 * Every head tag a published URL carries: its canonical, its cluster, its
 * Open Graph and Twitter properties, and its JSON-LD.
 *
 * The canonical and the cluster ship together. An `hreflang` cluster whose
 * members are not self-canonical is one Google discards.
 *
 * Rendered as a component, instead of assembled as strings, so React does
 * the ordinary attribute escaping on every value.
 */
export function SeoHeadTags({ seo }: { seo: SeoHead }) {
  return (
    <>
      {seo.canonical && <link href={seo.canonical} rel="canonical" />}

      <HreflangLinks alternates={seo.alternates} />

      {seo.meta.map(([key, content]) =>
        // Open Graph is the one vocabulary that keys on `property`; `twitter:`
        // and plain names such as `robots` key on `name`. vike-react spells the
        // `twitter:card` it emits for `/map` that way too, so a Twitter tag
        // cannot end up with two spellings on one site.
        isOpenGraphKey(key) ? (
          <meta key={`${key}:${content}`} content={content} property={key} />
        ) : (
          <meta key={`${key}:${content}`} content={content} name={key} />
        ),
      )}

      {isSafeJsonLd(seo.jsonLd) && (
        // Emitted verbatim: see `isSafeJsonLd` for why this is neither
        // re-escaped nor re-serialized.
        <script dangerouslySetInnerHTML={{ __html: seo.jsonLd }} type="application/ld+json" />
      )}
    </>
  )
}

/**
 * `noindex`, for a route that renders a real document at a URL no crawler
 * should keep: the two `embed` routes.
 *
 * An iframe target is a page, so a crawler that finds the URL — in a pasted
 * snippet, in a referrer log — will index it and then rank a bare player
 * against the page it belongs to. `robots.txt` cannot say this, because the
 * embed paths must stay fetchable for the iframe itself.
 */
export function NoIndexHead() {
  return <meta content="noindex" name="robots" />
}
