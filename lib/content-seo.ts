/**
 * The `<head>` document a content route publishes.
 *
 * One builder per content type, each called from that route's `+data.ts`
 * with the document already in hand. The result is a {@link SeoDocument}:
 * `lib/head.tsx` renders it, and reads nothing about pages, meditations or
 * lectures itself. `/map` reaches the same renderer with the document
 * SahajCloud serves (`lib/atlas-head.tsx`), so the whole site has one head
 * shape and one renderer.
 *
 * ⚠ **A field is emitted only when SahajCloud returned it.** Everything that
 * does fall back falls back to the site's own name and description, never to
 * an invented date, author or image.
 *
 * How a URL is spelled is not this module's business: `lib/urls.ts` owns
 * that, and `lib/hreflang.ts` owns which locales a document advertises.
 */

import logoUrl from '../assets/logo.svg'
import type {
  Locale,
  Meditation,
  Page,
  ResolvedLecture,
  WebConfig,
} from '../server/sahajcloud-types'
import type { SeoDocument } from './head'
import type { TFunction } from './i18n'
import { buildAlternates } from './hreflang'
import { isKnowledgePage } from './featured-nav'
import { contentIndexBlocks, type ResolvedCardItem } from './content-blocks'
import { getImageURL, getVariantName } from './cloudflare-images'
import { isPopulated, populatedImageUrl } from './payload-relationships'
import { absoluteHref, isSitePath, localeUrl, normalizeContentPath } from './urls'
import { documentEmbedHref } from './document-routes'
import type { SeoNode } from './seo-schema'
import { lecturePlaybackSeconds } from './lecture-shape'
import { SOCIAL_PROFILES, TWITTER_HANDLE } from './site-identity'
import {
  articleNode,
  audioObjectNode,
  breadcrumbNode,
  itemListNode,
  organizationNode,
  serializeJsonLd,
  videoObjectNode,
  webPageNode,
  webSiteNode,
  type Breadcrumb,
  type ListEntry,
} from './structured-data'
import type { Thing } from 'schema-dts'

/**
 * The share image a URL carries when its document has none of its own.
 *
 * 59 of 66 production pages have no `meta.image`, so without this most
 * shared links would have no preview at all. Served from `public/`, so the
 * absolute URL is the request origin plus this path.
 */
const DEFAULT_SHARE_IMAGE = '/images/metadata/preview.png'

/** Where a URL is published, and the language it is published in. */
export interface SeoRoute {
  /** The request origin, or null outside a Vike app. A guessed one is worse than none. */
  origin: string | null
  /** The locale-free content path, from `normalizeContentPath`. */
  path: string
  locale: Locale
  t: TFunction
}

/**
 * The route a `+data.ts` is answering for, as the builders need it.
 *
 * One derivation, so three content routes cannot spell "this URL" three ways
 * — and a fourth route inherits the answer rather than copying it.
 */
export function seoRoute(
  pageContext: { urlParsed: { origin: string | null }; urlPathname: string; locale: Locale },
  t: TFunction,
): SeoRoute {
  return {
    origin: pageContext.urlParsed.origin,
    path: normalizeContentPath(pageContext.urlPathname),
    locale: pageContext.locale,
    t,
  }
}

/**
 * A share-sized render of an image URL.
 *
 * og:image needs one large landscape render, so a Cloudflare Images URL
 * resolves to a `video` (16:9) variant, replacing the `/public` one
 * SahajCloud returns. Anything else is handed back untouched.
 */
function shareVariant(url: string): string {
  return getImageURL(url, getVariantName('video', 'large'))
}

/**
 * Resolves a `meta.image` relationship to a single og:image URL.
 *
 * Returns null when the image is missing or unpopulated (a bare id), which is
 * what lets the default take over.
 */
export function resolveOgImageUrl(image: unknown): string | null {
  const url = populatedImageUrl(image)

  return url ? shareVariant(url) : null
}

/** An image URL made absolute, for a `public/` path that is not one yet. */
function absoluteImage(origin: string | null, url: string | null): string | null {
  if (!url || !origin) {
    return null
  }

  return isSitePath(url) ? `${origin}${url}` : url
}

/**
 * The URL this route shares: its own image, else the site's default.
 *
 * Null only where the origin is unknown, because an og:image a scraper
 * cannot resolve is no share image at all.
 */
function shareImage(route: SeoRoute, own: string | null): string | null {
  return absoluteImage(route.origin, own) ?? absoluteImage(route.origin, DEFAULT_SHARE_IMAGE)
}

/**
 * This URL's self-referential canonical, or null where the origin is
 * unknown — outside a Vike app, where a guessed one is worse than none.
 *
 * Also the `og:url` and the `url` every JSON-LD node points at, so all three
 * come from one derivation. A node takes `?? ''`, which never reaches a page:
 * `baseDocument` serializes no nodes at all without an origin.
 */
function canonicalUrl(route: SeoRoute): string | null {
  return route.origin ? localeUrl(route.origin, route.locale, route.path) : null
}

/**
 * A locale as Open Graph spells one: `language_TERRITORY`, not BCP 47.
 *
 * Only the separator changes. SahajCloud stores no territory for a bare `en`,
 * and inventing `en_US` would claim a region nobody chose.
 */
function openGraphLocale(locale: Locale): string {
  return locale.replace('-', '_')
}

/** The parts every content route shares, before its own type is considered. */
function baseDocument(
  route: SeoRoute,
  options: {
    title: string
    description: string | null
    /** The absolute `og:image` URL, or null where the route advertises none. */
    image: string | null
    ogType: string
    /** The locales the `hreflang` cluster advertises. */
    locales: readonly Locale[]
    /** Nodes beyond `Organization` and `WebSite`, in the order they are emitted. */
    nodes: readonly Thing[]
    /**
     * The same `@graph`, as the descriptors Unhead's generator reads
     * (lib/seo-head-html.ts). A route supplies this instead of `nodes` once
     * it has moved; `jsonLd` then stays empty.
     */
    schema?: readonly SeoNode[]
  },
): SeoDocument {
  const { origin, path, locale, t } = route
  const siteName = t('common.general.site_title')
  const canonical = canonicalUrl(route)
  const meta: [string, string][] = [
    ['og:site_name', siteName],
    ['og:type', options.ogType],
    ['og:locale', openGraphLocale(locale)],
    ['twitter:site', TWITTER_HANDLE],
  ]

  if (canonical) {
    meta.push(['og:url', canonical])
  }
  if (options.image) {
    // `twitter:card` rides the image: a card promising a large image and
    // carrying none renders as an empty box.
    meta.push(['og:image', options.image], ['twitter:card', 'summary_large_image'])
  }
  // Exactly the locales the cluster lists, from the one derivation that
  // builds it. Two readings of "which translations exist" would eventually
  // disagree, and a crawler would see the page claim both.
  for (const advertised of options.locales) {
    meta.push(['og:locale:alternate', openGraphLocale(advertised)])
  }

  const organization = organizationNode({
    name: siteName,
    url: origin ?? '',
    logo: absoluteImage(origin, logoUrl) ?? '',
    sameAs: SOCIAL_PROFILES.map((profile) => profile.href),
  })

  return {
    title: options.title,
    description: options.description,
    canonical,
    alternates: origin ? buildAlternates({ origin, path, locales: options.locales }) : [],
    meta,
    ...(options.schema
      ? {
          schema: {
            site: {
              name: siteName,
              description: t('common.general.site_description'),
              logo: absoluteImage(origin, logoUrl) ?? '',
              sameAs: SOCIAL_PROFILES.map((profile) => profile.href),
            },
            inLanguage: locale,
            nodes: options.schema,
          },
        }
      : {}),
    // A route that supplies descriptors serializes nothing here: Unhead's
    // generator builds its graph, and two graphs on one page would claim the
    // same document twice.
    jsonLd:
      !origin || options.schema
        ? ''
        : serializeJsonLd([
            organization,
            // The site's own description, never the page's: this node describes
            // the site, and a crawler reading one page's summary as the whole
            // site's is a worse claim than no description at all.
            webSiteNode({
              name: siteName,
              url: origin,
              description: t('common.general.site_description'),
            }),
            ...options.nodes,
          ]),
  }
}

/**
 * `<name> | We Meditate`, the form every content URL but the home page takes.
 *
 * The site name comes from SahajCloud and the separator is punctuation, so
 * neither is a string this repo authors. A document with no name of its own
 * is served the site name alone, rather than a title that is half separator.
 */
function composeTitle(name: string | null, siteName: string): string {
  return name ? `${name} | ${siteName}` : siteName
}

/** Absolute URLs for the cards a content-index block server-rendered. */
function listEntries(items: readonly ResolvedCardItem[], route: SeoRoute): ListEntry[] {
  const { origin, locale } = route

  if (!origin) {
    return []
  }

  return items
    .filter((item) => isSitePath(item.href))
    .map((item) => ({ name: item.title, url: absoluteHref(origin, locale, item.href) }))
}

/**
 * Home → About Meditation → this page, for a page the knowledge menu lists.
 *
 * The middle rung is the menu itself, which is a heading rather than a page,
 * so it carries a name and no URL. The root rung is the site's own home page.
 */
function knowledgeTrail(
  page: Page,
  settings: Pick<WebConfig, 'knowledgePages'>,
  route: SeoRoute,
  name: string,
): Breadcrumb[] {
  const { origin, locale, t } = route

  if (!origin || !isKnowledgePage(page, settings)) {
    return []
  }

  return [
    { name: t('common.general.site_title'), url: localeUrl(origin, locale, '/') },
    { name: t('navigation.about_meditation') },
    { name },
  ]
}

/**
 * The head document for a `/:slug` page, including the home page.
 *
 * The home page takes the reversed title form the old site used —
 * `We Meditate | <tagline>` — because its own name is the site's name, and
 * `We Meditate | We Meditate` is what the ordinary form would produce.
 */
export function pageSeo(options: {
  page: Page
  settings: Pick<WebConfig, 'knowledgePages'>
  route: SeoRoute
  locales: readonly Locale[]
}): SeoDocument {
  const { page, settings, route } = options
  const { t } = route
  const siteName = t('common.general.site_title')
  const tagline = t('common.general.site_description')
  const name = page.meta?.title || page.title
  const description = page.meta?.description || tagline
  // ⚠ Two different images. The JSON-LD describes **this document**, so it
  // carries the page's own or nothing; the default would claim the site's
  // preview as the article's picture. `og:image` is a share card and takes
  // the default, because a link with no preview is worse than a generic one.
  const ownImage = absoluteImage(route.origin, resolveOgImageUrl(page.meta?.image))
  // `/` normalizes to `/`, and `/index` with it, so the route's own path is
  // the predicate — no caller can pass the wrong answer.
  const isHome = route.path === '/'
  // An author or an article tag is what makes a page an article rather than
  // a standing page of the site. Both come from SahajCloud; neither is inferred
  // from the slug, which is the editor's to change.
  const author = isPopulated<{ name?: string }>(page.author) ? page.author.name : null
  const isArticle = Boolean(author) || (page.tags?.length ?? 0) > 0
  const url = canonicalUrl(route) ?? ''
  const title = isHome
    ? `${siteName} | ${page.meta?.title || tagline}`
    : composeTitle(name, siteName)
  // The home page's own SahajCloud title is an internal name — `Home Page` in
  // production — so the composed title is the only name it may publish. Every
  // other page's name is the name it was given.
  const nodeName = isHome ? title : name
  const nodes: Thing[] = [webPageNode({ name: nodeName, url, description, image: ownImage })]

  if (isArticle) {
    nodes.push(
      articleNode({
        headline: nodeName,
        url,
        description,
        image: ownImage,
        authorName: author,
        datePublished: page.createdAt,
      }),
    )
  }

  const trail = knowledgeTrail(page, settings, route, name)

  if (trail.length > 0) {
    nodes.push(breadcrumbNode(trail))
  }

  for (const block of contentIndexBlocks(page.content)) {
    const entries = listEntries(block.resolvedItems ?? [], route)

    if (entries.length > 0) {
      nodes.push(itemListNode(entries))
    }
  }

  return baseDocument(route, {
    title,
    description,
    image: shareImage(route, ownImage),
    ogType: isArticle ? 'article' : 'website',
    locales: options.locales,
    nodes,
  })
}

/** The head document for `/meditations/:id`. */
export function meditationSeo(options: { meditation: Meditation; route: SeoRoute }): SeoDocument {
  const { meditation, route } = options
  const { t } = route
  const name = meditation.title || t('meditation.general.untitled')
  const thumbnail = absoluteImage(route.origin, resolveOgImageUrl(meditation.thumbnail))

  return baseDocument(route, {
    title: composeTitle(name, t('common.general.site_title')),
    description: t('common.general.site_description'),
    image: shareImage(route, thumbnail),
    // The new meditations are audio, so `video.other` would misdescribe them
    // and Open Graph has no audio page type.
    ogType: 'website',
    // `meditations` carries no per-locale publish state upstream, so this URL
    // claims no translations at all (lib/hreflang.ts).
    locales: [],
    nodes: [
      audioObjectNode({
        name,
        url: canonicalUrl(route) ?? '',
        thumbnailUrl: thumbnail,
        durationSeconds:
          meditation.durationMinutes == null ? null : meditation.durationMinutes * 60,
      }),
    ],
  })
}

/**
 * The head document for `/lectures/:id`.
 *
 * The one route whose head Unhead generates, as a graph of linked nodes
 * (`lib/seo-head-html.ts`). It carries `schema` descriptors rather than
 * serialized `jsonLd`, and its `+config.ts` declares `headHtmlEnd` rather
 * than `Head: ContentHead`.
 */
export function lectureSeo(options: { lecture: ResolvedLecture; route: SeoRoute }): SeoDocument {
  const { lecture, route } = options
  const { t } = route
  // `resolveLecture` hands back a URL, not a relationship, so the share
  // variant is taken here. A meditation's thumbnail gets the same treatment,
  // and both the share card and the media node then name one render.
  const poster = lecture.thumbnailUrl
    ? absoluteImage(route.origin, shareVariant(lecture.thumbnailUrl))
    : null
  const description = t('common.general.site_description')
  const embedPath = documentEmbedHref('lectures', lecture.id)
  const embedUrl =
    route.origin && embedPath ? absoluteHref(route.origin, route.locale, embedPath) : null

  return baseDocument(route, {
    title: composeTitle(lecture.title, t('common.general.site_title')),
    description,
    image: shareImage(route, poster),
    ogType: 'video.other',
    // `lectures` omits `_status` entirely upstream (lib/hreflang.ts).
    locales: [],
    nodes: [],
    // A lecture that has not synced carries no name, and a VideoObject named
    // after the site would describe the wrong thing. The WebPage node still
    // stands: the URL exists either way.
    schema: [
      {
        type: 'webPage',
        name: composeTitle(lecture.title, t('common.general.site_title')),
        description,
        // A lecture's poster is the video's still, not a picture of the page,
        // so the WebPage node claims none of its own.
        image: null,
      },
      ...(lecture.title
        ? ([
            {
              type: 'video',
              name: lecture.title,
              description,
              thumbnailUrl: poster,
              // ⚠ Nothing upstream records when a lecture was published.
              // `LectureMetadata` carries `lastSyncedAt`, which is when we
              // read it, and Google would rather have no date than a wrong
              // one. Emitting this needs an upstream field first.
              uploadDate: null,
              durationSeconds: lecturePlaybackSeconds(lecture),
              embedUrl,
            },
          ] as const)
        : []),
    ],
  })
}
