/**
 * The `<head>` document a content route publishes.
 *
 * One builder per content type, each called from that route's `+data.ts`
 * with the document already in hand. The result is a {@link SeoDocument}, and
 * `lib/seo-head-html.ts` generates the head from it knowing nothing about
 * pages, meditations or lectures. `/map` builds the same document out of the
 * answer SahajCloud serves (`lib/atlas-seo.ts`), so the whole site has one
 * head shape and one generator.
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
import {
  contentBlocks,
  contentIndexBlocks,
  type LayoutBlockFields,
  type ResolvedCardItem,
} from './content-blocks'
import type { Track } from '../components/molecules/AudioPlayer/types'
import { getImageURL, getVariantName, getVariantWidth } from './cloudflare-images'
import { isPopulated, populatedImageUrl } from './payload-relationships'
import { absoluteHref, isSafeHttpUrl, isSitePath, localeUrl, normalizeContentPath } from './urls'
import { documentEmbedHref } from './document-routes'
import type {
  SeoAuthor,
  SeoCrumb,
  SeoImage,
  SeoListEntry,
  SeoNode,
  SeoQuestion,
  SeoTrack,
} from './seo-schema'
import { lecturePlaybackSeconds } from './lecture-shape'
import { SOCIAL_PROFILES, TWITTER_HANDLE } from './site-identity'
import { PLAYER_HEIGHT, PLAYER_WIDTH } from './embed-player'
import { APP_STORE_ID } from './app-identity'
import { isCanonicalOrigin } from '../server/sitemap'

/**
 * The share image a URL carries when its document has none of its own.
 *
 * 59 of 66 production pages have no `meta.image`, so without this most
 * shared links would have no preview at all. Served from `public/`, so the
 * absolute URL is the request origin plus this path.
 */
const DEFAULT_SHARE_IMAGE = '/images/metadata/preview.png'

/**
 * The default asset's own pixels, stated because the file is ours.
 *
 * A card that carries its geometry renders at the right size before the
 * scraper has fetched the bytes. An upload's geometry comes from SahajCloud;
 * this one is in the repository, so it is read from the asset once here.
 * It is square, which is what makes it serve as the app icon too
 * (`lib/app-identity.ts`), and a 1.91:1 consumer centre-crops it.
 */
const DEFAULT_SHARE_IMAGE_SIZE = 1200

/** The width `shareVariant` renders at, which `og:image:width` states. */
const SHARE_IMAGE_WIDTH = getVariantWidth('video', 'large')

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
 * The image this route shares: its own, else the site's default.
 *
 * Null only where the origin is unknown, because an og:image a scraper
 * cannot resolve is no share image at all. The card's geometry and words
 * travel with the URL, so whichever image wins states its own.
 */
function shareImage(route: SeoRoute, own: SeoImage | null): SeoImage | null {
  if (own) {
    return own
  }

  const fallback = absoluteImage(route.origin, DEFAULT_SHARE_IMAGE)

  return fallback
    ? {
        url: fallback,
        width: DEFAULT_SHARE_IMAGE_SIZE,
        height: DEFAULT_SHARE_IMAGE_SIZE,
        alt: null,
      }
    : null
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

/**
 * A `meta.image` relationship as a node and a share card both need it.
 *
 * Null when the image is missing or unpopulated (a bare id), which is what
 * lets the default share image take over. `IMAGE_POPULATE` is what makes the
 * geometry and the alt text available (`server/sahajcloud-client.ts`); an
 * upload read without it answers `url: null`.
 */
export function resolveSeoImage(origin: string | null, image: unknown): SeoImage | null {
  const url = absoluteImage(origin, resolveOgImageUrl(image))

  if (!url || !isPopulated<{ width?: number; height?: number; alt?: string }>(image)) {
    return null
  }

  return { url, ...shareGeometry(image), alt: image.alt || null }
}

/**
 * The pixels the share render actually measures, or nothing.
 *
 * ⚠ **A flexible variant constrains the width alone**, so the height is the
 * source's ratio at that width, not the variant's name. Whether Cloudflare
 * upscales a source narrower than the variant is unverified, so an upload
 * below the variant width states no dimensions at all rather than one of two
 * possible answers.
 */
function shareGeometry(image: { width?: number; height?: number }): {
  width: number | null
  height: number | null
} {
  const { width, height } = image

  if (!width || !height || width < SHARE_IMAGE_WIDTH) {
    return { width: null, height: null }
  }

  return {
    width: SHARE_IMAGE_WIDTH,
    height: Math.round(height * (SHARE_IMAGE_WIDTH / width)),
  }
}

/**
 * `og:image`'s geometry and words, which a scraper reads without parsing
 * JSON-LD.
 *
 * A card that states its dimensions renders without waiting for the fetch,
 * and `twitter:image:alt` is what a screen reader announces in a timeline.
 */
function imageMeta(image: SeoImage): [string, string][] {
  const meta: [string, string][] = []

  if (image.width) meta.push(['og:image:width', String(image.width)])
  if (image.height) meta.push(['og:image:height', String(image.height)])
  if (image.alt) {
    meta.push(['og:image:alt', image.alt], ['twitter:image:alt', image.alt])
  }

  return meta
}

/** An article's byline, where SahajCloud populated one. */
function resolveAuthor(origin: string | null, value: unknown): SeoAuthor | null {
  if (
    !isPopulated<{ name?: string; title?: string; description?: string; photo?: unknown }>(value)
  ) {
    return null
  }

  return value.name
    ? {
        name: value.name,
        jobTitle: value.title || null,
        description: value.description || null,
        image: absoluteImage(origin, resolveOgImageUrl(value.photo)),
      }
    : null
}

/** The absolute player URL a media node advertises, where the route has one. */
function absoluteEmbedUrl(route: SeoRoute, embedPath: string | null): string | null {
  return route.origin && embedPath ? absoluteHref(route.origin, route.locale, embedPath) : null
}

/** The parts every content route shares, before its own type is considered. */
function baseDocument(
  route: SeoRoute,
  options: {
    title: string
    description: string | null
    /** The share card's image, or null where the route advertises none. */
    image: SeoImage | null
    ogType: string
    /** The locales the `hreflang` cluster advertises. */
    locales: readonly Locale[]
    /** The `@graph`, as the descriptors Unhead's generator reads. */
    nodes: readonly SeoNode[]
    /**
     * Open Graph beyond the properties every route carries — an article's
     * dates, a share image's geometry. `[key, content]`, as `meta` is.
     */
    extraMeta?: readonly (readonly [string, string])[]
    /**
     * The absolute player URL, for a route that has one. It turns the share
     * card into a playable one and publishes the oEmbed discovery link.
     */
    playerUrl?: string | null
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
    // carrying none renders as an empty box. A route with a player upgrades
    // that card below, where the player URL is also what makes it valid.
    meta.push(['og:image', options.image.url], ['twitter:card', 'summary_large_image'])
    // Open Graph's structured properties belong to the `og:image` above them,
    // so they are pushed here rather than left to a caller.
    meta.push(...imageMeta(options.image))
  }
  if (options.playerUrl) {
    meta.push(
      // ⚠ **A `player` card needs all four.** Twitter refuses a player card
      // with no dimensions and falls back to a link, and the same numbers are
      // what the oEmbed answer and the paste-ready snippet use.
      ['twitter:card', 'player'],
      ['twitter:player', options.playerUrl],
      ['twitter:player:width', String(PLAYER_WIDTH)],
      ['twitter:player:height', String(PLAYER_HEIGHT)],
      ['og:video', options.playerUrl],
      ['og:video:type', 'text/html'],
      ['og:video:width', String(PLAYER_WIDTH)],
      ['og:video:height', String(PLAYER_HEIGHT)],
    )
  }
  // ⚠ **Only the real site may be indexed.** `robots.txt` refuses a preview
  // Worker and a dev host wholesale, and this is what a crawler reaching one
  // of their URLs some other way reads — a pasted link, a referrer log. On the
  // real site the tag is the opposite claim: let the share image be shown at
  // full size in a result.
  meta.push(['robots', origin && isCanonicalOrigin(origin) ? 'max-image-preview:large' : 'noindex'])
  // Exactly the locales the cluster lists, from the one derivation that
  // builds it. Two readings of "which translations exist" would eventually
  // disagree, and a crawler would see the page claim both.
  for (const advertised of options.locales) {
    meta.push(['og:locale:alternate', openGraphLocale(advertised)])
  }

  // The App Store banner, on a content route only. An `embed` route builds no
  // document, so a player inside someone else's page never offers it.
  meta.push(['apple-itunes-app', `app-id=${APP_STORE_ID}`])

  for (const [key, content] of options.extraMeta ?? []) {
    meta.push([key, content])
  }

  return {
    title: options.title,
    description: options.description,
    canonical,
    alternates: origin ? buildAlternates({ origin, path, locales: options.locales }) : [],
    meta,
    // What a paste into WordPress or a chat client looks for before it calls
    // `/oembed`. Only a route with a player publishes one.
    links:
      canonical && options.playerUrl
        ? [
            {
              rel: 'alternate',
              type: 'application/json+oembed',
              href: `${origin}/oembed?url=${encodeURIComponent(canonical)}`,
            },
          ]
        : [],
    // The generator serializes the graph (lib/seo-head-html.ts), so no route
    // built here carries a second one of its own. `/map` is the exception:
    // its graph arrives already serialized (lib/atlas-seo.ts).
    jsonLd: '',
    schema: {
      site: {
        name: siteName,
        // The site's own description, never the page's: this node describes
        // the site, and a crawler reading one page's summary as the whole
        // site's is a worse claim than no description at all.
        description: t('common.general.site_description'),
        logo: absoluteImage(origin, logoUrl) ?? '',
        sameAs: SOCIAL_PROFILES.map((profile) => profile.href),
      },
      inLanguage: locale,
      nodes: options.nodes,
    },
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

/**
 * The questions a page both asks and answers, from its accordions.
 *
 * An accordion is the shape an FAQ is authored in — a heading that opens one
 * answer — and the class pages use it. Any other `layout` style is a visual
 * arrangement, not a question, so only `accordion` counts. An item with no
 * answer text is not a question a result could show.
 */
function pageQuestions(content: unknown): SeoQuestion[] {
  return contentBlocks<LayoutBlockFields>(content, 'layout')
    .filter((block) => block.style === 'accordion')
    .flatMap((block) => block.items ?? [])
    .flatMap((item) =>
      item.title && item.text ? [{ question: item.title, answer: item.text }] : [],
    )
}

/** Absolute URLs for the cards a content-index block server-rendered. */
function listEntries(items: readonly ResolvedCardItem[], route: SeoRoute): SeoListEntry[] {
  const { origin, locale } = route

  if (!origin) {
    return []
  }

  return items
    .filter((item) => isSitePath(item.href))
    .map((item) => ({ name: item.title, url: absoluteHref(origin, locale, item.href) }))
}

/**
 * The recordings a music-library block server-rendered.
 *
 * A `duration` of `0` is the absence SahajCloud stores for a song with no
 * usable length, not a recording of no length. The artist's link is an
 * off-site URL an editor typed, so it passes the scheme gate before it is
 * published.
 */
function playlistTracks(tracks: readonly Track[]): SeoTrack[] {
  return tracks
    .filter((track) => track.title.length > 0)
    .map((track) => ({
      name: track.title,
      artist: track.credit || null,
      artistUrl: isSafeHttpUrl(track.creditURL) ? track.creditURL : null,
      durationSeconds: track.duration > 0 ? track.duration : null,
    }))
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
): SeoCrumb[] {
  const { origin, locale, t } = route

  if (!origin || !isKnowledgePage(page, settings)) {
    return []
  }

  return [
    { name: t('common.general.site_title'), url: localeUrl(origin, locale, '/') },
    { name: t('navigation.about_meditation'), url: null },
    { name, url: null },
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
  // ⚠ Two different images. A node describes **this document**, so it carries
  // the page's own or nothing; the default would claim the site's preview as
  // the article's picture. `og:image` is a share card and takes the default,
  // because a link with no preview is worse than a generic one.
  const ownImage = resolveSeoImage(route.origin, page.meta?.image)
  // `/` normalizes to `/`, and `/index` with it, so the route's own path is
  // the predicate — no caller can pass the wrong answer.
  const isHome = route.path === '/'
  // An author or an article tag is what makes a page an article rather than
  // a standing page of the site. Both come from SahajCloud; neither is inferred
  // from the slug, which is the editor's to change.
  const author = resolveAuthor(route.origin, page.author)
  const isArticle = Boolean(author) || (page.tags?.length ?? 0) > 0
  const title = isHome
    ? `${siteName} | ${page.meta?.title || tagline}`
    : composeTitle(name, siteName)
  // The home page's own SahajCloud title is an internal name — `Home Page` in
  // production — so the composed title is the only name it may publish. Every
  // other page's name is the name it was given.
  const nodeName = isHome ? title : name
  const nodes: SeoNode[] = [{ type: 'webPage', name: nodeName, description, image: ownImage }]

  if (isArticle) {
    nodes.push({
      type: 'article',
      headline: nodeName,
      description,
      image: ownImage,
      author,
      datePublished: page.createdAt,
      dateModified: page.updatedAt,
    })
  }

  const trail = knowledgeTrail(page, settings, route, name)

  if (trail.length > 0) {
    nodes.push({ type: 'breadcrumb', trail })
  }

  const questions = pageQuestions(page.content)

  if (questions.length > 0) {
    nodes.push({ type: 'faq', questions })
  }

  for (const block of contentIndexBlocks(page.content)) {
    const entries = listEntries(block.resolvedItems ?? [], route)

    if (entries.length > 0) {
      nodes.push({ type: 'itemList', entries })
    }

    const tracks = playlistTracks(block.resolvedTracks ?? [])

    if (tracks.length > 0) {
      nodes.push({ type: 'musicPlaylist', name: nodeName, tracks })
    }
  }

  return baseDocument(route, {
    title,
    description,
    image: shareImage(route, ownImage),
    ogType: isArticle ? 'article' : 'website',
    locales: options.locales,
    nodes,
    extraMeta: [
      // Open Graph's own article namespace, which a scraper reads without
      // parsing JSON-LD. Only an article carries them.
      ...(isArticle
        ? ([
            ['article:published_time', page.createdAt],
            ['article:modified_time', page.updatedAt],
            ...(author ? ([['article:author', author.name]] as const) : []),
          ] as const)
        : []),
    ],
  })
}

/** The head document for `/meditations/:id`. */
export function meditationSeo(options: { meditation: Meditation; route: SeoRoute }): SeoDocument {
  const { meditation, route } = options
  const { t } = route
  const name = meditation.title || t('meditation.general.untitled')
  const description = t('common.general.site_description')
  const thumbnail = resolveSeoImage(route.origin, meditation.thumbnail)
  const playerUrl = absoluteEmbedUrl(route, documentEmbedHref('meditations', meditation.id))

  return baseDocument(route, {
    title: composeTitle(name, t('common.general.site_title')),
    description,
    image: shareImage(route, thumbnail),
    // The new meditations are audio, so `video.other` would misdescribe them
    // and Open Graph has no audio page type.
    ogType: 'website',
    // `meditations` carries no per-locale publish state upstream, so this URL
    // claims no translations at all (lib/hreflang.ts).
    locales: [],
    nodes: [
      {
        type: 'webPage',
        name: composeTitle(name, t('common.general.site_title')),
        description,
        image: null,
      },
      {
        type: 'audio',
        name,
        description,
        thumbnailUrl: thumbnail?.url ?? null,
        durationSeconds:
          meditation.durationMinutes == null ? null : meditation.durationMinutes * 60,
        embedUrl: playerUrl,
      },
    ],
    playerUrl,
  })
}

/**
 * The head document for `/lectures/:id`.
 *
 * It carries `schema` descriptors rather than serialized `jsonLd`. Every
 * route built here does; `/map` is the one document whose graph arrives
 * already serialized, from upstream (`lib/atlas-seo.ts`).
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
  const title = composeTitle(lecture.title, t('common.general.site_title'))
  const playerUrl = absoluteEmbedUrl(route, documentEmbedHref('lectures', lecture.id))

  return baseDocument(route, {
    title,
    description,
    image: shareImage(route, poster ? { url: poster, width: null, height: null, alt: null } : null),
    ogType: 'video.other',
    // `lectures` omits `_status` entirely upstream (lib/hreflang.ts).
    locales: [],
    // A lecture that has not synced carries no name, and a VideoObject named
    // after the site would describe the wrong thing. The WebPage node still
    // stands: the URL exists either way.
    nodes: [
      // A lecture's poster is the video's still, not a picture of the page,
      // so the WebPage node claims none of its own.
      { type: 'webPage', name: title, description, image: null },
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
              embedUrl: playerUrl,
            },
          ] as const)
        : []),
    ],
    playerUrl,
  })
}
