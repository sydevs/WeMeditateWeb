/**
 * `GET /oembed` — the discovery endpoint a consumer calls to turn one of our
 * media URLs into an embedded player.
 *
 * A paste into WordPress, Discourse or a chat client looks for the
 * `<link rel="alternate" type="application/json+oembed">` the content route
 * publishes, then calls this. `index.ts` beside it holds every rule; this
 * file is the one read and the status codes.
 *
 * The two media routes answer and nothing else does: `resolveOEmbedTarget`
 * checks the origin as well as the path, so a URL on someone else's host
 * cannot make us answer for their page.
 */

import type { Hono } from 'hono'
import type { SahajCloudEnv } from '../sahajcloud-context'
import { getDocumentById, getLecture, getWebTranslations } from '../sahajcloud-client'
import { documentEmbedHref } from '../../lib/document-routes'
import { resolveLecture } from '../../lib/lecture-shape'
import { absoluteHref } from '../../lib/urls'
import { buildOEmbedResponse, positiveInteger, resolveOEmbedTarget, type OEmbedTarget } from '.'
import { getT } from '../../lib/i18n'

/** oEmbed answers are as stable as the documents behind them. */
const CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=1800'

/** The title and poster a player advertises, or nulls where the read found none. */
async function readMedia(
  target: OEmbedTarget,
): Promise<{ title: string | null; thumbnailUrl: string | null } | null> {
  const { locale } = target

  if (target.collection === 'lectures') {
    const lecture = await getLecture({ id: target.id, locale })

    if (!lecture) {
      return null
    }

    // A clip reads its title and poster from its parent, so the player
    // advertises the same two the page does.
    const resolved = resolveLecture(lecture)

    return { title: resolved.title, thumbnailUrl: resolved.thumbnailUrl }
  }

  const meditation = await getDocumentById({
    collection: 'meditations',
    id: target.id,
    locale,
  })

  if (!meditation) {
    return null
  }

  const thumbnail = meditation.thumbnail

  return {
    title: meditation.title ?? null,
    thumbnailUrl:
      typeof thumbnail === 'object' && thumbnail !== null && typeof thumbnail.url === 'string'
        ? thumbnail.url
        : null,
  }
}

export function registerOEmbedRoutes(app: Hono<SahajCloudEnv>): void {
  app.get('/oembed', async (c) => {
    const { origin } = new URL(c.req.url)
    const url = c.req.query('url')
    const format = c.req.query('format')

    // The spec reserves 501 for a format the provider does not implement, and
    // names XML as the other one. We answer JSON only.
    if (format && format !== 'json') {
      return c.json({ error: 'Only the json format is available.' }, 501)
    }

    const target = url ? resolveOEmbedTarget(url, origin) : null

    if (!target) {
      return c.json({ error: 'That URL is not a player on this site.' }, 404)
    }

    const { locale } = target
    const embedPath = documentEmbedHref(target.collection, target.id)

    if (!embedPath) {
      return c.json({ error: 'That URL is not a player on this site.' }, 404)
    }

    const [media, translations] = await Promise.all([
      readMedia(target),
      getWebTranslations({ locale }),
    ])

    if (!media) {
      return c.json({ error: 'That URL is not a player on this site.' }, 404)
    }

    const t = getT(translations, locale)

    c.header('Cache-Control', CACHE_CONTROL)

    return c.json(
      buildOEmbedResponse({
        playerUrl: absoluteHref(origin, locale, embedPath),
        siteName: t('common.general.site_title'),
        siteUrl: origin,
        title: media.title,
        thumbnailUrl: media.thumbnailUrl,
        maxWidth: positiveInteger(c.req.query('maxwidth')),
        maxHeight: positiveInteger(c.req.query('maxheight')),
      }),
    )
  })
}
