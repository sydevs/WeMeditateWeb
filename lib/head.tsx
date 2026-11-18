/**
 * SEO `<head>` rendering, for every route that publishes a URL.
 *
 * There is one head mechanism here, and the work is split the way
 * vike-react splits it:
 *
 * - `title` and `description` are vike-react settings, declared once in
 *   `pages/+config.ts` as the two functions below. Vike turns them into
 *   `<title>`, `og:title`, `description` and `og:description`, and re-applies
 *   them on a client-side navigation, which no `Head` component gets to do.
 * - Everything else — the canonical, the `hreflang` cluster, the rest of
 *   Open Graph, and JSON-LD — is a `Head` component, because `useConfig`
 *   emits no `<link>` and no `<script>`.
 *
 * Both halves read one {@link SeoDocument}, built server-side in the route's
 * `+data.ts`: `lib/content-seo.ts` for a content route, the upstream answer
 * for `/map` (`lib/atlas-head.tsx`). A route that builds none — an `embed`
 * route, the error page — serves the site's own title and description and
 * publishes no URL claim at all.
 *
 * See https://vike.dev/useConfig and https://vike.dev/title
 */

import type { PageContext } from 'vike/types'
import { pageContextT } from '../hooks/useT'
import { useOptionalPageContext } from '../hooks/usePageContext'
import type { Alternate } from './hreflang'

/** The `<head>` tags a URL contributes beyond vike-react's own settings. */
export interface SeoHead {
  /** The URL's self-referential canonical, or null where it publishes none. */
  canonical: string | null
  alternates: readonly Alternate[]
  /** `[property, content]` pairs — a list, because `og:locale:alternate` repeats. */
  meta: readonly (readonly [string, string])[]
  /** A serialized `application/ld+json` body, or `''` for none. */
  jsonLd: string
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

      {seo.meta.map(([property, content]) => (
        <meta key={`${property}:${content}`} content={content} property={property} />
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
 * The {@link SeoDocument} a route's `+data.ts` built, or null.
 *
 * Null for every route that publishes no URL: an `embed` route, the error
 * page, and anything rendered outside a Vike app.
 */
export function seoDocument(data: unknown): SeoDocument | null {
  const { seo } = (data ?? {}) as { seo?: SeoDocument }

  return seo ?? null
}

/**
 * `<title>` for whichever route is rendering. Declared as `title` in
 * `pages/+config.ts`, so one declaration covers the whole site.
 *
 * A route with no document of its own falls back to the site's own name,
 * in the locale of the URL — the embed routes and the error page.
 */
export function contentTitle(pageContext: PageContext): string {
  return (
    seoDocument(pageContext.data)?.title ?? pageContextT(pageContext)('common.general.site_title')
  )
}

/** `description` and `og:description`, on the same terms as {@link contentTitle}. */
export function contentDescription(pageContext: PageContext): string {
  return (
    seoDocument(pageContext.data)?.description ??
    pageContextT(pageContext)('common.general.site_description')
  )
}

/**
 * The head tags for whichever content route is rendering. Declared as
 * `Head: ContentHead` in a route's `+config.ts`, beside its
 * `Layout: LayoutChrome`.
 *
 * That is the level this belongs at. "This route is an indexable content
 * URL" is route identity, exactly like "this route wears the site chrome",
 * and a new content route opts in with one declarative line instead of
 * remembering a hook call. It is also why this is not set from a template:
 * `PageTemplate`, `MeditationTemplate` and `LectureTemplate` are shared
 * with the `embed` routes and the live preview, and none of those is a URL
 * to point a crawler at.
 */
export function ContentHead() {
  const pageContext = useOptionalPageContext()
  const seo = seoDocument(pageContext?.data)

  if (!seo) {
    return null
  }

  // ⚠ **A live preview is not a URL to point a crawler at** — the repo
  // convention that kept this out of the templates in the first place,
  // because they are shared with the `embed` routes and with preview.
  //
  // Preview used to be its own route, which declared no `Head` at all. Now it
  // is the real route with a token on it, so the suppression has to happen
  // here instead. Without it, previewing a DRAFT page emits a canonical and a
  // full hreflang cluster pointing at a URL that 404s publicly — and under
  // `draft: true` the alternates would advertise unpublished locales too.
  //
  // `X-Robots-Tag: noindex` also rides the response, but a canonical is a
  // claim about another URL and is worth not making at all.
  if (pageContext?.livePreview?.active) {
    return null
  }

  return <SeoHeadTags seo={seo} />
}
