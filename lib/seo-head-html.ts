/**
 * The `<head>` an indexable route publishes, rendered as HTML by Unhead.
 *
 * Declared as `headHtmlEnd: seoHeadHtml` in `pages/+config.ts`, and nowhere
 * else: the setting is global as well as cumulative, so a second declaration
 * renders the head twice on every page. Vike calls it once per request, on
 * the server, for every route; the document the route's `+data.ts` built is
 * what decides whether it returns anything. **Never a component hook**:
 * `PageTemplate`, `MeditationTemplate` and `LectureTemplate` are shared with
 * the `embed` routes and the live preview, so a hook called from a template
 * would publish a head for a URL that must claim nothing.
 *
 * Every route that publishes a URL comes through here, `/map` included: a
 * content route hands it descriptors to link (`lib/seo-schema.ts`), and
 * `/map` hands it the block SahajCloud already serialized
 * (`lib/atlas-seo.ts`).
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
  defineArticle,
  defineBreadcrumb,
  defineImage,
  defineItemList,
  defineOrganization,
  definePerson,
  defineQuestion,
  defineVideo,
  defineWebPage,
  defineWebSite,
  type UseSchemaOrgInput,
} from '@unhead/schema-org'
import type { PageContextServer } from 'vike/types'
import { seoDocument } from './head-settings'
import { isoDuration } from './structured-data'
import { isOpenGraphKey, isSafeJsonLd, type SeoHead } from './head'
import type { SeoAuthor, SeoImage, SeoNode, SeoSchema } from './seo-schema'

/**
 * An image node, so a crawler reads its geometry and its words rather than
 * only its URL. Unhead hoists it to its own `ImageObject` and links it.
 */
function imageNode(image: SeoImage | null) {
  if (!image) {
    return null
  }

  return defineImage({
    url: image.url,
    width: image.width ?? undefined,
    height: image.height ?? undefined,
    caption: image.alt ?? undefined,
  })
}

/** The byline, as the `Person` an `Article` points at. */
function personNode(author: SeoAuthor | null) {
  if (!author) {
    return null
  }

  return definePerson({
    name: author.name,
    jobTitle: author.jobTitle ?? undefined,
    description: author.description ?? undefined,
    image: author.image ?? undefined,
  })
}

/** Seconds as the ISO 8601 duration schema.org's `duration` expects. */
function duration(seconds: number | null) {
  return seconds == null ? undefined : (isoDuration(seconds) ?? undefined)
}

/**
 * The `@id` of the player this page is mainly about, if it has one.
 *
 * ⚠ **Minted here rather than left to Unhead**, because the `WebPage` has to
 * point at it and the media helpers mint their own ids after the fact. An
 * FAQ needs no entry: Unhead links a `Question` into an `FAQPage`'s
 * `mainEntity` itself, and naming them here lists each one twice.
 */
function mainEntityId(canonical: string | null, nodes: readonly SeoNode[]): string | undefined {
  const media = nodes.find((node) => node.type === 'audio' || node.type === 'video')

  return canonical && media ? `${canonical}#${media.type}` : undefined
}

/** What a node needs to know about the page it sits on. */
interface NodeContext {
  inLanguage: string
  /** The page's own URL, which a media node names as its own. */
  url: string | undefined
  /** The `@id` of the player the page is mainly about, where it has one. */
  mainEntity: string | undefined
  /** True where the page asks and answers, which types the WebPage. */
  isFaq: boolean
}

/** One node as `useSchemaOrg` takes it: a helper's output, or a plain node. */
type SchemaOrgNodeInput = Exclude<UseSchemaOrgInput, readonly unknown[]>

/**
 * The schema-org input for one {@link SeoNode}.
 *
 * Always a list, because one descriptor may contribute several nodes: an FAQ
 * emits one `Question` per item.
 */
function schemaNode(node: SeoNode, context: NodeContext): SchemaOrgNodeInput[] {
  const { inLanguage, mainEntity, url } = context

  switch (node.type) {
    case 'webPage':
      return [
        defineWebPage({
          // ⚠ **Pinned, because Unhead infers a subtype from the URL.** A page
          // at `/about` would be typed `AboutPage`, and `/contact`
          // `ContactPage` — a claim read off a slug the editor owns and may
          // change, which is why the ticket left both out. A page that asks
          // and answers really is an FAQPage, and Google reads that result off
          // the type plus `mainEntity`.
          '@type': context.isFaq ? ['WebPage', 'FAQPage'] : 'WebPage',
          name: node.name,
          description: node.description ?? undefined,
          // Unhead falls back to the Organization logo as the page's primary
          // image. That is a claim about this document, so a page with no
          // picture of its own publishes none.
          primaryImageOfPage: imageNode(node.image),
          mainEntity: mainEntity ? { '@id': mainEntity } : undefined,
          inLanguage,
        }),
      ]
    case 'article':
      return [
        defineArticle({
          headline: node.headline,
          description: node.description ?? undefined,
          image: imageNode(node.image) ?? undefined,
          author: personNode(node.author) ?? undefined,
          datePublished: node.datePublished ?? undefined,
          dateModified: node.dateModified ?? undefined,
          inLanguage,
        }),
      ]
    // ⚠ **No `defineAudio` exists**, so this is a plain node rather than a
    // helper's output. It joins the same graph, and the `@id` is minted above
    // because the `WebPage` names it as its main entity.
    case 'audio':
      return [
        {
          '@type': 'AudioObject' as const,
          ...(mainEntity ? { '@id': mainEntity } : {}),
          name: node.name,
          ...(url ? { url } : {}),
          ...(node.description ? { description: node.description } : {}),
          ...(node.thumbnailUrl ? { thumbnailUrl: node.thumbnailUrl } : {}),
          ...(duration(node.durationSeconds) ? { duration: duration(node.durationSeconds) } : {}),
          ...(node.embedUrl ? { embedUrl: node.embedUrl } : {}),
          inLanguage,
        },
      ]
    case 'video':
      return [
        defineVideo({
          ...(mainEntity ? { '@id': mainEntity } : {}),
          name: node.name,
          url,
          // `defineVideo` substitutes the literal `No description` for an
          // absent one, so the field is always supplied.
          description: node.description ?? undefined,
          thumbnailUrl: node.thumbnailUrl ?? undefined,
          uploadDate: node.uploadDate ?? undefined,
          duration: duration(node.durationSeconds),
          embedUrl: node.embedUrl ?? undefined,
          inLanguage,
        }),
      ]
    case 'breadcrumb':
      return [
        defineBreadcrumb({
          itemListElement: node.trail.map((crumb) => ({
            name: crumb.name,
            item: crumb.url ?? undefined,
          })),
        }),
      ]
    case 'faq':
      return node.questions.map((question, index) =>
        defineQuestion({
          ...(url ? { '@id': `${url}#question-${index + 1}` } : {}),
          name: question.question,
          acceptedAnswer: question.answer,
          inLanguage,
        }),
      )
    case 'itemList':
      return [
        defineItemList({
          itemListElement: node.entries.map((entry) => ({
            name: entry.name,
            url: entry.url,
          })),
        }),
      ]
    // ⚠ **No `defineMusicPlaylist` exists**, so the playlist and each of its
    // recordings are plain nodes, as `AudioObject` is.
    case 'musicPlaylist':
      return [
        {
          '@type': 'MusicPlaylist' as const,
          name: node.name,
          numTracks: node.tracks.length,
          track: node.tracks.map((track) => ({
            '@type': 'MusicRecording' as const,
            name: track.name,
            // No `inLanguage`: the page's locale is the language of the
            // track's name, not of a recording that may be instrumental.
            ...(track.artist
              ? {
                  byArtist: {
                    '@type': 'MusicGroup' as const,
                    name: track.artist,
                    ...(track.artistUrl ? { url: track.artistUrl } : {}),
                  },
                }
              : {}),
            ...(duration(track.durationSeconds)
              ? { duration: duration(track.durationSeconds) }
              : {}),
          })),
          inLanguage,
        },
      ]
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
export function renderSeoHead(seo: SeoHead, host: string): string {
  const head = seoHead(host)

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
      // `rel="alternate"` with a `type` and no `hreflang` is the oEmbed
      // discovery shape, which is why it is not a cluster row.
      ...(seo.links ?? []).map((link) => ({
        rel: link.rel as 'alternate',
        type: link.type,
        href: link.href,
      })),
    ],
    meta: seo.meta.map(([key, content]) =>
      isOpenGraphKey(key) ? { property: key, content } : { name: key, content },
    ),
  })

  if (seo.schema) {
    pushGraph(head, seo.schema, seo.canonical, host)
  } else if (isSafeJsonLd(seo.jsonLd)) {
    // ⚠ **The block is pushed whole, not rebuilt.** `/map`'s graph is
    // serialized upstream, where the ownership walk that mints its ids lives,
    // and a round trip through `JSON.parse` here would drop the escaping that
    // makes it safe to embed. Unhead neutralizes `</script` inside an
    // `innerHTML` and emits the rest verbatim, which is what this needs.
    pushHead(head, {
      script: [{ type: 'application/ld+json', innerHTML: seo.jsonLd }],
    })
  }

  return head.render().headTags
}

/**
 * One head instance per request.
 *
 * ⚠ **`disableDefaults` is load-bearing** — see this module's own note.
 */
function seoHead(host: string) {
  return createHead({
    disableDefaults: true,
    plugins: [UnheadSchemaOrg({ host })],
  })
}

/** The `@graph` a route described as descriptors, as linked schema.org nodes. */
function pushGraph(
  head: ReturnType<typeof seoHead>,
  schema: SeoSchema,
  canonical: string | null,
  host: string,
): void {
  const context: NodeContext = {
    inLanguage: schema.inLanguage,
    url: canonical ?? undefined,
    mainEntity: mainEntityId(canonical, schema.nodes),
    isFaq: schema.nodes.some((node) => node.type === 'faq'),
  }

  pushSchemaOrg(
    head,
    [
      defineOrganization({
        name: schema.site.name,
        url: host,
        logo: schema.site.logo,
        sameAs: [...schema.site.sameAs],
      }),
      // The site's own description, never the page's: a crawler reading one
      // page's summary as the whole site's is a worse claim than none.
      defineWebSite({
        name: schema.site.name,
        description: schema.site.description,
        inLanguage: schema.inLanguage,
      }),
      // A node kind may contribute several, which `faq` does.
      ...schema.nodes.flatMap((node) => schemaNode(node, context)),
    ],
    // The plugin's own default is `bodyClose`, where a crawler that reads only
    // the head never sees it.
    { tagPosition: 'head' },
  )
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

  // A document with neither a graph nor a serialized block is a route that
  // publishes no URL claim: an `embed` route, the error page.
  if (!seo || (!seo.schema && !seo.jsonLd) || !host || pageContext.livePreview?.active) {
    return ''
  }

  return renderSeoHead(seo, host)
}
