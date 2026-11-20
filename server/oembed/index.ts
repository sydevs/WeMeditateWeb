/**
 * Pure builders for `/oembed`, the discovery endpoint a consumer calls to
 * turn one of our media URLs into an embedded player.
 *
 * The response shape is the oEmbed 1.0 spec's `video` type
 * (https://oembed.com). Only the two media routes answer: a consumer asking
 * about anything else is told the resource is not one we embed, which the
 * spec spells as a 404.
 *
 * The route handler is `routes.ts` beside it. This module reads nothing.
 */

import { matchDocumentRoute } from '../../lib/document-routes'
import { PLAYER_HEIGHT, PLAYER_WIDTH, playerIframe } from '../../lib/embed-player'
import { localeFromPath } from '../../lib/urls'
import type { Locale } from '../sahajcloud-types'

/** The collections that have a player, and the order their routes are tried. */
const EMBEDDABLE = ['meditations', 'lectures'] as const

export type EmbeddableCollection = (typeof EMBEDDABLE)[number]

/** A media URL on our own origin, resolved to the document behind it. */
export interface OEmbedTarget {
  collection: EmbeddableCollection
  id: string
  /** The language the consumer's own URL asked for, which the player keeps. */
  locale: Locale
}

/**
 * Reads a consumer's `url` parameter as one of our own media URLs.
 *
 * ⚠ **The origin is checked, not just the path.** The parameter is whatever a
 * caller sends, and a URL on someone else's host that happens to end in
 * `/meditations/1` must not make us answer for their page. Returns null for
 * every URL that is not a media route on `origin`, which the route answers as
 * a 404.
 */
export function resolveOEmbedTarget(url: string, origin: string): OEmbedTarget | null {
  let parsed: URL

  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (parsed.origin !== origin) {
    return null
  }

  // ⚠ **The locale comes off here.** `matchDocumentRoute` takes a bare path:
  // Vike strips a real locale before a route function runs, and this is a Hono
  // route where nothing has (#315). Only a code SahajCloud defines is stripped,
  // so `/zz/lectures/163` stays unmatched and is refused.
  const { locale, pathWithoutLocale } = localeFromPath(parsed.pathname)

  for (const collection of EMBEDDABLE) {
    const matched = matchDocumentRoute(collection, pathWithoutLocale)

    if (matched) {
      return { collection, id: matched.routeParams.id, locale }
    }
  }

  return null
}

/** One oEmbed `video` response. */
export interface OEmbedResponse {
  version: '1.0'
  type: 'video'
  provider_name: string
  provider_url: string
  title?: string
  html: string
  width: number
  height: number
  thumbnail_url?: string
  thumbnail_width?: number
}

/**
 * The response body for a player, bounded by whatever `maxwidth` and
 * `maxheight` the consumer asked for.
 *
 * The spec lets a consumer cap the size, and a provider that ignores the cap
 * gets its iframe clipped. The aspect ratio is kept, so the smaller of the two
 * constraints decides.
 */
export function buildOEmbedResponse(options: {
  playerUrl: string
  siteName: string
  siteUrl: string
  title: string | null
  thumbnailUrl: string | null
  maxWidth: number | null
  maxHeight: number | null
}): OEmbedResponse {
  const scale = Math.min(
    1,
    options.maxWidth ? options.maxWidth / PLAYER_WIDTH : 1,
    options.maxHeight ? options.maxHeight / PLAYER_HEIGHT : 1,
  )
  const width = Math.round(PLAYER_WIDTH * scale)
  const height = Math.round(PLAYER_HEIGHT * scale)

  return {
    version: '1.0',
    type: 'video',
    provider_name: options.siteName,
    provider_url: options.siteUrl,
    ...(options.title ? { title: options.title } : {}),
    html: playerIframe(options.playerUrl)
      .replace(`width="${PLAYER_WIDTH}"`, `width="${width}"`)
      .replace(`height="${PLAYER_HEIGHT}"`, `height="${height}"`),
    width,
    height,
    ...(options.thumbnailUrl
      ? { thumbnail_url: options.thumbnailUrl, thumbnail_width: width }
      : {}),
  }
}

/**
 * A positive integer from a query parameter, or null.
 *
 * A consumer sending `maxwidth=0` or `maxwidth=abc` is asking for nothing
 * usable, and a zero scale would render a 0×0 iframe.
 */
export function positiveInteger(value: string | undefined): number | null {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}
