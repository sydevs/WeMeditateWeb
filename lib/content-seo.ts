/**
 * The `<head>` document a content route publishes.
 *
 * One builder per content type, each called from that route's `+data.ts` with
 * the document already in hand. `lib/seo-head-html.ts` renders the result
 * knowing nothing about pages, meditations or lectures.
 *
 * ⚠ **A field is emitted only when SahajCloud returned it.** Fallbacks are the
 * site's own name, description and share card, never an invented date, author
 * or image.
 */

import logoUrl from '../assets/logo.svg'
import type { UseSeoMetaInput } from 'unhead/types'
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
import type { Track } from '../components/molecules/AudioPlayer/types'
import { getImageURL, getVariantName, getVariantWidth } from './cloudflare-images'
import { isPopulated, populatedImageUrl } from './payload-relationships'
import { absoluteHref, isSafeHttpUrl, isSitePath, localeUrl, normalizeContentPath } from './urls'
import { documentEmbedHref } from './document-routes'
import type { SeoAuthor, SeoImage, SeoNode, SeoTrack } from './seo-schema'
import { lecturePlaybackSeconds } from './lecture-shape'
import { SOCIAL_PROFILES } from './site-identity'
import { PLAYER_HEIGHT, PLAYER_WIDTH } from './embed-player'

/**
 * The share card a URL carries when its document has none of its own — 59 of
 * 66 production pages. Its geometry is stated because the file is ours, and
 * `content-seo.test.ts` reads it off the asset.
 */
const DEFAULT_SHARE_IMAGE = { path: '/images/metadata/share.png', width: 1200, height: 630 }

/** The width `shareVariant` renders at. */
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

/** The route a `+data.ts` is answering for, as the builders need it. */
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

/** A share-sized (16:9, large) render of a Cloudflare Images URL; anything else untouched. */
function shareVariant(url: string): string {
  return getImageURL(url, getVariantName('video', 'large'))
}

/** An image URL made absolute, for a site path that is not one yet. */
function absoluteImage(origin: string | null, url: string | null | undefined): string | undefined {
  if (!url || !origin) {
    return undefined
  }

  return isSitePath(url) ? `${origin}${url}` : url
}

/**
 * A `meta.image`-style relationship as a share render with its words and,
 * where knowable, its geometry. Undefined for a missing or unpopulated image.
 *
 * ⚠ **A flexible variant constrains the width alone**, so the height is the
 * source's ratio at that width. Whether Cloudflare upscales a narrower source
 * is unverified, so such an upload states no geometry at all.
 */
export function resolveSeoImage(origin: string | null, image: unknown): SeoImage | undefined {
  const source = populatedImageUrl(image)
  const url = source ? absoluteImage(origin, shareVariant(source)) : undefined

  if (!url || !isPopulated<{ width?: number; height?: number; alt?: string }>(image)) {
    return undefined
  }

  const { width, height, alt } = image
  const measured = !!width && !!height && width >= SHARE_IMAGE_WIDTH

  return {
    url,
    ...(measured && {
      width: SHARE_IMAGE_WIDTH,
      height: Math.round(height * (SHARE_IMAGE_WIDTH / width)),
    }),
    ...(alt && { alt }),
  }
}

/** The image this route shares: its own, else the site's default card. */
function shareImage(route: SeoRoute, own: SeoImage | undefined): SeoImage | undefined {
  const fallback = absoluteImage(route.origin, DEFAULT_SHARE_IMAGE.path)

  if (own || !fallback) {
    return own
  }

  return { url: fallback, width: DEFAULT_SHARE_IMAGE.width, height: DEFAULT_SHARE_IMAGE.height }
}

/** Open Graph spells a locale `language_TERRITORY`; only the separator changes. */
function openGraphLocale(locale: Locale): string {
  return locale.replace('-', '_')
}

/** An article's byline, where SahajCloud populated one. */
function resolveAuthor(origin: string | null, value: unknown): SeoAuthor | undefined {
  if (
    !isPopulated<{ name?: string; title?: string; description?: string; photo?: unknown }>(value) ||
    !value.name
  ) {
    return undefined
  }

  return {
    name: value.name,
    jobTitle: value.title || undefined,
    description: value.description || undefined,
    image: resolveSeoImage(origin, value.photo)?.url,
  }
}

/** The parts every content route shares, before its own type is considered. */
function baseDocument(
  route: SeoRoute,
  options: {
    title: string
    description: string
    /** The share card, or undefined where the route advertises none. */
    image: SeoImage | undefined
    ogType: UseSeoMetaInput['ogType']
    /** The locales the `hreflang` cluster advertises. */
    locales: readonly Locale[]
    nodes: readonly SeoNode[]
    /** Open Graph beyond what every route carries: an article's dates. */
    seoMeta?: UseSeoMetaInput
    /** The absolute player URL, for a route that has one. */
    playerUrl?: string
  },
): SeoDocument {
  const { origin, path, locale, t } = route
  const { image, playerUrl } = options
  const siteName = t('common.general.site_title')
  // Also `og:url` and the `url` every JSON-LD node points at.
  const canonical = origin ? localeUrl(origin, locale, path) : null
  const player: UseSeoMetaInput = playerUrl
    ? {
        // ⚠ Twitter refuses a player card with no dimensions and falls back to a link.
        twitterCard: 'player',
        twitterPlayer: playerUrl,
        twitterPlayerWidth: PLAYER_WIDTH,
        twitterPlayerHeight: PLAYER_HEIGHT,
        ogVideo: { url: playerUrl, width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
      }
    : {}
  // ⚠ `twitter:card` rides the image: a large-image card with none renders as an empty box.
  const card: UseSeoMetaInput = image
    ? { ogImage: image, twitterCard: 'summary_large_image', twitterImageAlt: image.alt }
    : {}

  return {
    title: options.title,
    description: options.description,
    canonical,
    alternates: origin ? buildAlternates({ origin, path, locales: options.locales }) : [],
    seoMeta: {
      ogSiteName: siteName,
      ogType: options.ogType,
      ogLocale: openGraphLocale(locale),
      // Exactly the cluster's locales, from the one derivation that builds it.
      ogLocaleAlternate: options.locales.length ? options.locales.map(openGraphLocale) : undefined,
      ogUrl: canonical ?? undefined,
      ...card,
      ...player,
      ...options.seoMeta,
    },
    // Unhead types `og:video:type` as a file format; a player is an HTML page.
    meta: playerUrl ? [{ property: 'og:video:type', content: 'text/html' }] : undefined,
    // What a paste into WordPress or a chat client looks for before calling `/oembed`.
    links:
      canonical && playerUrl
        ? [
            {
              rel: 'alternate',
              type: 'application/json+oembed',
              href: `${origin}/oembed?url=${encodeURIComponent(canonical)}`,
            },
          ]
        : [],
    // ⚠ A guessed URL is worse than none, so no origin means no graph.
    schema: origin
      ? {
          site: {
            name: siteName,
            description: t('common.general.site_description'),
            logo: absoluteImage(origin, logoUrl) ?? '',
            sameAs: SOCIAL_PROFILES.map((profile) => profile.href),
          },
          inLanguage: locale,
          nodes: options.nodes,
        }
      : undefined,
  }
}

/** `<name> | We Meditate`, or the site name alone for a document with no name. */
function composeTitle(name: string | null | undefined, siteName: string): string {
  return name ? `${name} | ${siteName}` : siteName
}

/** Absolute URLs for the cards a content-index block server-rendered. */
function listEntries(items: readonly ResolvedCardItem[], route: SeoRoute) {
  const { origin, locale } = route

  return origin
    ? items
        .filter((item) => isSitePath(item.href))
        .map((item) => ({ name: item.title, url: absoluteHref(origin, locale, item.href) }))
    : []
}

/**
 * The recordings a music-library block server-rendered.
 *
 * A `duration` of `0` is SahajCloud's absence, not a recording of no length.
 * The artist's link is an editor-typed off-site URL, so it passes the scheme gate.
 */
function playlistTracks(tracks: readonly Track[]): SeoTrack[] {
  return tracks
    .filter((track) => track.title.length > 0)
    .map((track) => ({
      name: track.title,
      artist: track.credit || undefined,
      artistUrl: isSafeHttpUrl(track.creditURL) ? track.creditURL : undefined,
      durationSeconds: track.duration > 0 ? track.duration : undefined,
    }))
}

/**
 * The head document for a `/:slug` page, including the home page.
 *
 * The home page takes the reversed form, `We Meditate | <tagline>`, because
 * its own name is the site's name.
 */
export function pageSeo(options: {
  page: Page
  settings: Pick<WebConfig, 'knowledgePages'>
  route: SeoRoute
  locales: readonly Locale[]
}): SeoDocument {
  const { page, settings, route } = options
  const { origin, locale, t } = route
  const siteName = t('common.general.site_title')
  const tagline = t('common.general.site_description')
  const name = page.meta?.title || page.title
  const description = page.meta?.description || tagline
  // ⚠ Two different images: a node describes this document, so it carries the
  // page's own or nothing; og:image is a share card and takes the default.
  const ownImage = resolveSeoImage(origin, page.meta?.image)
  const isHome = route.path === '/'
  // An author or an article tag makes a page an article. Neither is read off
  // the slug, which is the editor's to change.
  const author = resolveAuthor(origin, page.author)
  const isArticle = Boolean(author) || (page.tags?.length ?? 0) > 0
  const title = isHome
    ? `${siteName} | ${page.meta?.title || tagline}`
    : composeTitle(name, siteName)
  // The home page's SahajCloud title is an internal name (`Home Page`).
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

  // The header's knowledge menu is a heading, not a page, so it is no rung:
  // Google requires every rung but the last to carry a URL.
  if (origin && isKnowledgePage(page, settings)) {
    nodes.push({
      type: 'breadcrumb',
      trail: [
        { name: siteName, url: localeUrl(origin, locale, '/') },
        { name, url: localeUrl(origin, locale, route.path) },
      ],
    })
  }

  for (const block of contentIndexBlocks(page.content)) {
    const entries = listEntries(block.resolvedItems ?? [], route)
    const tracks = playlistTracks(block.resolvedTracks ?? [])

    if (entries.length > 0) {
      nodes.push({ type: 'itemList', entries })
    }
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
    seoMeta: isArticle
      ? {
          articlePublishedTime: page.createdAt,
          articleModifiedTime: page.updatedAt,
          articleAuthor: author ? [author.name] : undefined,
        }
      : undefined,
  })
}

/** The absolute player URL for a media document. */
function playerUrl(route: SeoRoute, collection: 'meditations' | 'lectures', id: number) {
  const embedPath = documentEmbedHref(collection, id)

  return route.origin && embedPath ? absoluteHref(route.origin, route.locale, embedPath) : undefined
}

/**
 * The head document for `/meditations/:id`.
 *
 * `meditations` carries no per-locale publish state upstream, so the URL
 * claims no translations (lib/hreflang.ts).
 */
export function meditationSeo(options: { meditation: Meditation; route: SeoRoute }): SeoDocument {
  const { meditation, route } = options
  const { t } = route
  const name = meditation.title || t('meditation.general.untitled')
  const title = composeTitle(name, t('common.general.site_title'))
  const description = t('common.general.site_description')
  const thumbnail = resolveSeoImage(route.origin, meditation.thumbnail)
  const player = playerUrl(route, 'meditations', meditation.id)

  return baseDocument(route, {
    title,
    description,
    image: shareImage(route, thumbnail),
    // Open Graph has no audio page type, and `video.other` would misdescribe one.
    ogType: 'website',
    locales: [],
    nodes: [
      { type: 'webPage', name: title, description },
      {
        type: 'audio',
        name,
        description,
        thumbnailUrl: thumbnail?.url,
        durationSeconds:
          meditation.durationMinutes == null ? undefined : meditation.durationMinutes * 60,
        embedUrl: player,
      },
    ],
    playerUrl: player,
  })
}

/**
 * The head document for `/lectures/:id`.
 *
 * `lectures` omits `_status` upstream, so the URL claims no translations.
 */
export function lectureSeo(options: { lecture: ResolvedLecture; route: SeoRoute }): SeoDocument {
  const { lecture, route } = options
  const { t } = route
  // `resolveLecture` hands back a URL, not a relationship, so no geometry is known.
  const poster = lecture.thumbnailUrl
    ? absoluteImage(route.origin, shareVariant(lecture.thumbnailUrl))
    : undefined
  const description = t('common.general.site_description')
  const title = composeTitle(lecture.title, t('common.general.site_title'))
  const player = playerUrl(route, 'lectures', lecture.id)

  return baseDocument(route, {
    title,
    description,
    image: shareImage(route, poster ? { url: poster } : undefined),
    ogType: 'video.other',
    locales: [],
    nodes: [
      // The poster is the video's still, not a picture of the page.
      { type: 'webPage', name: title, description },
      // A lecture that has not synced carries no name, and a VideoObject named
      // after the site would describe the wrong thing.
      ...(lecture.title
        ? [
            {
              type: 'video' as const,
              name: lecture.title,
              description,
              thumbnailUrl: poster,
              durationSeconds: lecturePlaybackSeconds(lecture) ?? undefined,
              embedUrl: player,
              // TODO: `uploadDate`, which Google requires, once SahajCloud
              // stores when a talk was given (sydevs/SahajCloud#1236).
            },
          ]
        : []),
    ],
    playerUrl: player,
  })
}

/**
 * The head document for `/meditations`, the list the mood finder offers.
 *
 * The one route here with no SahajCloud document behind it, so there is no
 * per-locale publish state to filter by: it advertises every locale the site
 * offers, where every content route advertises the subset its own document is
 * published in.
 */
export function meditationsIndexSeo(options: {
  route: SeoRoute
  locales: readonly Locale[]
}): SeoDocument {
  const { route, locales } = options
  const { t } = route
  const name = t('meditation.general.all_meditations')
  const title = composeTitle(name, t('common.general.site_title'))
  const description = t('common.general.site_description')

  return baseDocument(route, {
    title,
    description,
    image: shareImage(route, undefined),
    ogType: 'website',
    locales,
    nodes: [{ type: 'webPage', name, description }],
  })
}
