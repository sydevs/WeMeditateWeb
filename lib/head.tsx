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
 *   `<link>` and no `<script>`. One generator renders it for every route,
 *   with Unhead (`lib/seo-head-html.ts`).
 *
 * Both halves read one {@link SeoDocument}, built server-side in the route's
 * `+data.ts` — by `lib/content-seo.ts` for a content route, and by
 * `lib/atlas-seo.ts` from the answer SahajCloud serves for `/map`. A route
 * that builds none — an `embed` route, the error page — serves the site's own
 * title and description and publishes no URL claim at all.
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
 * SahajCloud's own `jsonLdEscape()` neutralizes `</script>` and `<!--`, with
 * JSON escapes that round-trip to the same characters. This is why the string
 * is handed to the generator whole instead of re-escaped. HTML-escaping a
 * JSON string would corrupt it, and running it through `JSON.parse` and
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
