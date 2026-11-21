/**
 * The `<head>` an indexable route publishes, rendered as HTML by Unhead.
 *
 * ⚠ **Declared once, as `headHtmlEnd: seoHeadHtml` in `pages/+config.ts`.**
 * The setting is global as well as cumulative, so a second declaration renders
 * the head twice on every page. A route opts in by building a `seo` document
 * in its `+data.ts`. **Never a component hook**: the templates are shared with
 * the `embed` routes and the live preview, which must claim nothing.
 *
 * Unhead is here for the `@graph`: it mints an `@id` per node and links them
 * (`WebPage.isPartOf` the `WebSite`, its `publisher` the `Organization`).
 */

import { createHead } from 'unhead/server'
// ⚠ Aliased away from the `use` prefix: these take the head explicitly and are
// plain functions, which `@eslint-react/rules-of-hooks` would read as hooks.
import { useHead as pushHead, useSeoMeta as pushSeoMeta } from 'unhead'
import {
  UnheadSchemaOrg,
  useSchemaOrg as pushSchemaOrg,
  defineArticle,
  defineBreadcrumb,
  defineImage,
  defineItemList,
  defineOrganization,
  definePerson,
  defineVideo,
  defineWebPage,
  defineWebSite,
  type UseSchemaOrgInput,
} from '@unhead/schema-org'
import type { PageContextServer } from 'vike/types'
import { isCanonicalOrigin } from './canonical-origin'
import { seoDocument } from './head-settings'
import { isoDuration } from './structured-data'
import { isSafeJsonLd, type SeoHead } from './head'
import { APP_STORE_ID, TWITTER_HANDLE } from './site-identity'
import type { SeoImage, SeoNode, SeoSchema } from './schema'

const imageNode = (image: SeoImage | undefined) =>
  image &&
  defineImage({ url: image.url, width: image.width, height: image.height, caption: image.alt })

const duration = (seconds: number | undefined) =>
  seconds == null ? undefined : (isoDuration(seconds) ?? undefined)

type SchemaOrgNodeInput = Exclude<UseSchemaOrgInput, readonly unknown[]>

/**
 * The schema-org input for one {@link SeoNode}.
 *
 * `inLanguage` is set on the nodes Unhead does not fill from the plugin's own
 * config: the `WebPage`, and the plain nodes no helper exists for.
 */
function schemaNode(
  node: SeoNode,
  context: { url: string | undefined; inLanguage: string; mainEntity: string | undefined },
): SchemaOrgNodeInput {
  const { url, inLanguage, mainEntity } = context

  switch (node.type) {
    case 'webPage':
      return defineWebPage({
        // ⚠ Pinned: Unhead infers a subtype from the URL (`/about` →
        // `AboutPage`), a claim read off a slug the editor owns.
        '@type': 'WebPage',
        name: node.name,
        description: node.description,
        // ⚠ Always supplied, `null` included: Unhead falls back to the Organization logo.
        primaryImageOfPage: imageNode(node.image) ?? null,
        mainEntity: mainEntity ? { '@id': mainEntity } : undefined,
        inLanguage,
      })
    case 'article':
      return defineArticle({
        headline: node.headline,
        description: node.description,
        image: imageNode(node.image),
        author: node.author && definePerson({ ...node.author }),
        datePublished: node.datePublished,
        dateModified: node.dateModified,
      })
    // ⚠ No `defineAudio` exists, so this one is a plain node.
    case 'audio':
      return {
        '@type': 'AudioObject',
        '@id': mainEntity,
        name: node.name,
        url,
        description: node.description,
        thumbnailUrl: node.thumbnailUrl,
        duration: duration(node.durationSeconds),
        embedUrl: node.embedUrl,
        inLanguage,
      }
    case 'video':
      return defineVideo({
        '@id': mainEntity,
        name: node.name,
        url,
        // ⚠ Always supplied: `defineVideo` substitutes `No description`.
        description: node.description,
        thumbnailUrl: node.thumbnailUrl,
        duration: duration(node.durationSeconds),
        embedUrl: node.embedUrl,
      })
    case 'breadcrumb':
      return defineBreadcrumb({
        itemListElement: node.trail.map((crumb) => ({ name: crumb.name, item: crumb.url })),
      })
    case 'itemList':
      return defineItemList({ itemListElement: [...node.entries] })
    // ⚠ `defineMusicPlaylist` types `track` as an `@id` reference, so a nested
    // recording would need a cast. A plain node renders the same graph.
    case 'musicPlaylist':
      return {
        '@type': 'MusicPlaylist',
        '@id': url && `${url}#playlist`,
        name: node.name,
        numTracks: node.tracks.length,
        track: node.tracks.map((track) => ({
          '@type': 'MusicRecording',
          name: track.name,
          // No `inLanguage`: the page's locale is the language of the track's
          // name, not of a recording that may be instrumental.
          byArtist: track.artist && {
            '@type': 'MusicGroup',
            name: track.artist,
            url: track.artistUrl,
          },
          duration: duration(track.durationSeconds),
        })),
        inLanguage,
      }
  }
}

/** Every tag a published URL contributes beyond vike-react's own settings. */
export function renderSeoHead(seo: SeoHead, host: string): string {
  const head = createHead({
    // ⚠ Load-bearing: Unhead's server defaults add a charset, a viewport and
    // `<html lang>`, which vike-react already writes.
    disableDefaults: true,
    plugins: [UnheadSchemaOrg({ host, inLanguage: seo.schema?.inLanguage })],
  })

  pushHead(head, {
    link: [
      ...(seo.canonical ? [{ rel: 'canonical' as const, href: seo.canonical }] : []),
      ...seo.alternates.map((alternate) => ({ rel: 'alternate' as const, ...alternate })),
      ...(seo.links ?? []),
    ],
    meta: seo.meta,
  })
  pushSeoMeta(head, {
    // ⚠ Only the real site may be indexed. A preview Worker or a dev host is
    // refused by robots.txt too; this covers a crawler arriving some other way.
    robots: isCanonicalOrigin(host) ? 'max-image-preview:large' : 'noindex',
    twitterSite: TWITTER_HANDLE,
    appleItunesApp: `app-id=${APP_STORE_ID}`,
    ...seo.seoMeta,
  })

  if (seo.schema) {
    pushGraph(head, seo.schema, seo.canonical ?? undefined, host)
  } else if (isSafeJsonLd(seo.jsonLd)) {
    // ⚠ Pushed whole, not rebuilt: `/map`'s graph is serialized upstream, and
    // a `JSON.parse` round trip would drop the escaping that makes it safe.
    pushHead(head, { script: [{ type: 'application/ld+json', innerHTML: seo.jsonLd }] })
  }

  return head.render().headTags
}

function pushGraph(
  head: Parameters<typeof pushHead>[0],
  schema: SeoSchema,
  url: string | undefined,
  host: string,
): void {
  const { inLanguage } = schema
  // The player the page is mainly about. Minted here because the WebPage names
  // it, and the media helpers mint their ids after the fact.
  const media = schema.nodes.find((node) => node.type === 'audio' || node.type === 'video')
  const mainEntity = url && media ? `${url}#${media.type}` : undefined

  pushSchemaOrg(
    head,
    [
      defineOrganization({
        name: schema.site.name,
        url: host,
        logo: schema.site.logo,
        sameAs: [...schema.site.sameAs],
      }),
      // The site's own description, never the page's.
      defineWebSite({ name: schema.site.name, description: schema.site.description }),
      ...schema.nodes.map((node) => schemaNode(node, { url, inLanguage, mainEntity })),
    ],
    // The plugin defaults to `bodyClose`, which a crawler reading only the head misses.
    { tagPosition: 'head' },
  )
}

/**
 * The `headHtmlEnd` hook: the head for the rendering route, or `''` for one
 * that publishes no URL.
 *
 * ⚠ A live preview is the real route with a token on it, so it builds the
 * document too; it must not publish a canonical for a draft that 404s publicly.
 */
export function seoHeadHtml(pageContext: PageContextServer): string {
  const seo = seoDocument(pageContext.data)
  const host = pageContext.urlParsed.origin

  if (!seo || !host || pageContext.livePreview?.active) {
    return ''
  }

  return renderSeoHead(seo, host)
}
