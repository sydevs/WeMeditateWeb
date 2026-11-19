/**
 * The `<head>` a content route publishes, rendered as HTML by Unhead.
 *
 * Declared as `headHtmlEnd: seoHeadHtml` in a route's `+config.ts`. Vike
 * calls it once per request, on the server, with the document the route's
 * `+data.ts` built. **Never a component hook**: `PageTemplate`,
 * `MeditationTemplate` and `LectureTemplate` are shared with the `embed`
 * routes and the live preview, so a hook called from a template would
 * publish a head for a URL that must claim nothing.
 *
 * What Unhead is here for is the `@graph`: it mints an `@id` per node and
 * links them — `WebPage.isPartOf` the `WebSite`, the `WebSite.publisher` the
 * `Organization`, an image hoisted to its own `ImageObject` — which
 * hand-written nodes did not do. It also dedupes by key, so a tag pushed
 * twice is emitted once.
 *
 * ⚠ **`disableDefaults` is load-bearing.** Unhead's server default inserts
 * `<meta charset>`, the viewport meta and `<html lang>`, and vike-react
 * already writes all three plus `<title>` and the description. Without it
 * every page would carry each of them twice.
 */

import { createHead } from 'unhead/server'
// ⚠ Both are aliased away from their `use` prefix. Unhead names them for its
// Vue and React adapters, but these two take the head instance explicitly and
// are plain functions — `@eslint-react/rules-of-hooks` reads the prefix as a
// React hook and errors. Keeping the prefix here would also read as the
// component-level head hook this repo forbids, which is the opposite of what
// a server-only generator is.
import { useHead as pushHead } from 'unhead'
import {
  UnheadSchemaOrg,
  useSchemaOrg as pushSchemaOrg,
  defineOrganization,
  defineVideo,
  defineWebPage,
  defineWebSite,
} from '@unhead/schema-org'
import type { PageContextServer } from 'vike/types'
import { seoDocument } from './head-settings'
import { isoDuration } from './structured-data'
import { isOpenGraphKey, type SeoHead } from './head'
import type { SeoNode, SeoSchema } from './seo-schema'

/** The schema-org input for one {@link SeoNode}. */
function schemaNode(node: SeoNode, schema: SeoSchema) {
  const { inLanguage } = schema

  switch (node.type) {
    case 'webPage':
      return defineWebPage({
        name: node.name,
        description: node.description ?? undefined,
        // Unhead falls back to the Organization logo as the page's primary
        // image. That is a claim about this document, so a page with no
        // picture of its own publishes none.
        primaryImageOfPage: node.image ?? null,
        inLanguage,
      })
    case 'video':
      return defineVideo({
        name: node.name,
        // `defineVideo` substitutes the literal `No description` for an
        // absent one, so the field is always supplied.
        description: node.description ?? undefined,
        thumbnailUrl: node.thumbnailUrl ?? undefined,
        uploadDate: node.uploadDate ?? undefined,
        duration:
          node.durationSeconds == null
            ? undefined
            : (isoDuration(node.durationSeconds) ?? undefined),
        embedUrl: node.embedUrl ?? undefined,
        inLanguage,
      })
  }
}

/**
 * Every tag a published URL contributes beyond vike-react's own settings:
 * the canonical, the `hreflang` cluster, Open Graph, Twitter, and the
 * `@graph`.
 *
 * Takes the host explicitly rather than reading the canonical, because the
 * schema-org plugin resolves every `@id` and relative URL against it.
 */
export function renderSeoHead(seo: SeoHead & { schema: SeoSchema }, host: string): string {
  const head = createHead({
    disableDefaults: true,
    plugins: [UnheadSchemaOrg({ host })],
  })

  pushHead(head, {
    link: [
      ...(seo.canonical ? [{ rel: 'canonical' as const, href: seo.canonical }] : []),
      // The lowercase spelling is deliberate: these tags exist for crawlers
      // to read, and some pattern-match instead of parsing.
      ...seo.alternates.map((alternate) => ({
        rel: 'alternate' as const,
        hreflang: alternate.hreflang,
        href: alternate.href,
      })),
    ],
    meta: seo.meta.map(([key, content]) =>
      isOpenGraphKey(key) ? { property: key, content } : { name: key, content },
    ),
  })

  pushSchemaOrg(
    head,
    [
      defineOrganization({
        name: seo.schema.site.name,
        url: host,
        logo: seo.schema.site.logo,
        sameAs: [...seo.schema.site.sameAs],
      }),
      // The site's own description, never the page's: a crawler reading one
      // page's summary as the whole site's is a worse claim than none.
      defineWebSite({
        name: seo.schema.site.name,
        description: seo.schema.site.description,
        inLanguage: seo.schema.inLanguage,
      }),
      ...seo.schema.nodes.map((node) => schemaNode(node, seo.schema)),
    ],
    // The plugin's own default is `bodyClose`, where a crawler that reads only
    // the head never sees it.
    { tagPosition: 'head' },
  )

  return head.render().headTags
}

/**
 * The `headHtmlEnd` hook: the head for whichever route is rendering, or the
 * empty string for a route that publishes no URL.
 *
 * A live preview is not a URL to point a crawler at. Preview used to be its
 * own route, which declared no head at all; it is now the real route with a
 * token on it, so the suppression happens here. Without it, previewing a
 * draft page would emit a canonical and a full `hreflang` cluster for a URL
 * that 404s publicly.
 */
export function seoHeadHtml(pageContext: PageContextServer): string {
  const seo = seoDocument(pageContext.data)
  const host = pageContext.urlParsed.origin

  if (!seo?.schema || !host || pageContext.livePreview?.active) {
    return ''
  }

  return renderSeoHead({ ...seo, schema: seo.schema }, host)
}
