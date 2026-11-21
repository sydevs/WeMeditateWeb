/**
 * Pure builders for `/oembed`, which turns one of our media URLs into an
 * embedded player: the oEmbed 1.0 `video` type (https://oembed.com). The
 * route is `route.ts`; this module reads nothing.
 */

import {
  documentEmbedHref,
  EMBEDDABLE_COLLECTIONS,
  matchDocumentRoute,
  type EmbeddableCollection,
} from '@/lib/urls/document-routes'
import { PLAYER_HEIGHT, PLAYER_WIDTH, playerIframe } from '@/lib/media/embed-player'
import { localeFromPath } from '@/lib/urls/urls'
import type { Locale } from '@/types/sahajcloud'

/** A media URL on our own origin, resolved to the document and player behind it. */
export interface OEmbedTarget {
  collection: EmbeddableCollection
  id: string
  /** The language the consumer's URL asked for, which the player keeps. */
  locale: Locale
  embedPath: string
}

/**
 * Reads a consumer's `url` parameter as one of our own media URLs, or null.
 *
 * ⚠ **The origin is checked, not just the path**, or a URL on someone else's
 * host ending in `/meditations/1` would make us answer for their page.
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

  // ⚠ `matchDocumentRoute` takes a bare path, and this Hono route has had no
  // locale stripped (#315). Only a code SahajCloud defines is stripped, so
  // `/zz/lectures/163` stays unmatched.
  const { locale, pathWithoutLocale } = localeFromPath(parsed.pathname)

  for (const collection of EMBEDDABLE_COLLECTIONS) {
    const matched = matchDocumentRoute(collection, pathWithoutLocale)
    const embedPath = matched && documentEmbedHref(collection, matched.routeParams.id)

    if (matched && embedPath) {
      return { collection, id: matched.routeParams.id, locale, embedPath }
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
}

/**
 * The response body for a player, within the consumer's `maxwidth` and
 * `maxheight`. The ratio is kept and the player is never scaled up.
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
    ...(options.title && { title: options.title }),
    html: playerIframe(options.playerUrl, width, height),
    width,
    height,
    // No `thumbnail_width`: the spec requires its height beside it, and the
    // upload's own geometry is not read here.
    ...(options.thumbnailUrl && { thumbnail_url: options.thumbnailUrl }),
  }
}

/** A positive integer from a query parameter, or null: a zero scale renders a 0×0 iframe. */
export function positiveInteger(value: string | undefined): number | null {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}
