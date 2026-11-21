/**
 * `GET /oembed`, which a paste into WordPress, Discourse or a chat client
 * calls after finding the `application/json+oembed` link a media route
 * publishes. `oembed.ts` holds the rules; this is the read and the statuses.
 */

import type { Hono } from 'hono'
import type { SahajCloudEnv } from '@/server/sahajcloud/context'
import { getDocumentById, getLecture, getWebTranslations } from '@/server/sahajcloud/client'
import { resolveLecture } from '@/lib/content/lecture-shape'
import { populatedImageUrl } from '@/lib/content/payload-relationships'
import { absoluteHref } from '@/lib/urls/urls'
import { getT } from '@/lib/i18n/i18n'
import { JSON_CACHE_CONTROL } from '@/server/cache-headers'
import {
  buildOEmbedResponse,
  positiveInteger,
  resolveOEmbedTarget,
  type OEmbedTarget,
} from './oembed'

const NOT_FOUND = { error: 'That URL is not a player on this site.' }

/** The title and poster a player advertises, or null where the read found nothing. */
async function readMedia(
  target: OEmbedTarget,
): Promise<{ title: string | null; thumbnailUrl: string | null } | null> {
  const { id, locale } = target

  if (target.collection === 'lectures') {
    const lecture = await getLecture({ id, locale })

    // A clip reads its title and poster from its parent, as the page does.
    return lecture && resolveLecture(lecture)
  }

  const meditation = await getDocumentById({ collection: 'meditations', id, locale })

  return (
    meditation && {
      title: meditation.title ?? null,
      thumbnailUrl: populatedImageUrl(meditation.thumbnail) ?? null,
    }
  )
}

export function registerOEmbed(app: Hono<SahajCloudEnv>): void {
  app.get('/oembed', async (c) => {
    const { origin } = new URL(c.req.url)
    const url = c.req.query('url')
    const format = c.req.query('format')

    // The spec reserves 501 for a format the provider does not implement.
    if (format && format !== 'json') {
      return c.json({ error: 'Only the json format is available.' }, 501)
    }

    const target = url ? resolveOEmbedTarget(url, origin) : null
    const [media, translations] = target
      ? await Promise.all([readMedia(target), getWebTranslations({ locale: target.locale })])
      : []

    if (!target || !media || !translations) {
      return c.json(NOT_FOUND, 404)
    }

    c.header('Cache-Control', JSON_CACHE_CONTROL)

    return c.json(
      buildOEmbedResponse({
        playerUrl: absoluteHref(origin, target.locale, target.embedPath),
        siteName: getT(translations, target.locale)('common.general.site_title'),
        siteUrl: origin,
        title: media.title,
        thumbnailUrl: media.thumbnailUrl,
        maxWidth: positiveInteger(c.req.query('maxwidth')),
        maxHeight: positiveInteger(c.req.query('maxheight')),
      }),
    )
  })
}
