/**
 * SEO `<head>` types, for every route that publishes a URL.
 *
 * - `title` and `description` are vike-react settings (`lib/head-settings.ts`),
 *   which vike re-applies on a client-side navigation.
 * - Everything else is raw head HTML generated once per request on the server
 *   by Unhead (`lib/seo-head-html.ts`), because `useConfig` emits no `<link>`
 *   and no `<script>`.
 *
 * Both read one {@link SeoDocument}, built in the route's `+data.ts`. A route
 * that builds none — an `embed` route, the error page — publishes no URL claim.
 *
 * See https://vike.dev/head-tags
 */

import type { Link, Meta, UseSeoMetaInput } from 'unhead/types'
import type { Alternate } from './hreflang'
import type { SeoSchema } from './seo-schema'

/** The `<head>` tags a URL contributes beyond vike-react's own settings. */
export interface SeoHead {
  /** The URL's self-referential canonical, or null where it publishes none. */
  canonical: string | null
  alternates: readonly Alternate[]
  /** Open Graph and Twitter in Unhead's flat spelling (`ogImage`, `twitterCard`, …). */
  seoMeta: UseSeoMetaInput
  /** Rows already keyed by `property`, as `/map`'s upstream answer arrives. */
  meta?: Meta[]
  /** `<link>` tags beyond the canonical and the cluster: the oEmbed discovery link. */
  links?: Link[]
  /** The `@graph` as plain data (`lib/seo-schema.ts`). */
  schema?: SeoSchema
  /** A pre-serialized `application/ld+json` body, for `/map` alone. */
  jsonLd?: string
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
 * SahajCloud's `jsonLdEscape()` neutralizes `</script>` and `<!--` with JSON
 * escapes, so the string is emitted whole: HTML-escaping it would corrupt the
 * JSON, and a `JSON.parse` round trip would drop the escaping.
 *
 * ⚠ The sink is a `<script>` block carrying SahajCloud-authored text, so this
 * fails closed — dropping the block — rather than repairing the string.
 */
export function isSafeJsonLd(jsonLd: string | undefined): jsonLd is string {
  return !!jsonLd && !/<\/script|<!--/i.test(jsonLd)
}

/**
 * `noindex`, for the two `embed` routes: an iframe target a crawler finds
 * would otherwise rank a bare player against its own page. `robots.txt`
 * cannot say this, because the iframe must stay fetchable.
 */
export function NoIndexHead() {
  return <meta content="noindex" name="robots" />
}
