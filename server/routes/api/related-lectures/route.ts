/**
 * `GET /api/related-lectures/:meditationId` — lectures related to a
 * meditation, for the meditation player. Client-loaded for the reason
 * `related-meditations/route.ts` gives.
 *
 * Audience-gated: audiences come from the site config. getRelatedLectures
 * returns [] when none are set.
 */

import type { Hono } from 'hono'
import type { SahajCloudEnv } from '@/server/sahajcloud/context'
import { getRelatedLectures, getWebConfig } from '@/server/sahajcloud/client'
import { idSchema } from '@/server/validation'
import { parseLocale } from '@/types/sahajcloud'
import { relatedLecturesToCards } from '@/lib/content/related-content'
import { relatedAnswer } from '@/server/routes/api/_related'

export function registerRelatedLectures(app: Hono<SahajCloudEnv>): void {
  app.get('/api/related-lectures/:meditationId', async (c) => {
    let id: string

    try {
      id = idSchema.parse(c.req.param('meditationId'))
    } catch {
      return c.json({ items: [] }, 400)
    }
    const locale = parseLocale(c.req.query('locale'))

    // getWebConfig can rethrow after retries are exhausted (the fetchers
    // themselves degrade internally). Related content never 500s. Fall
    // back to empty.
    try {
      const settings = await getWebConfig({ locale })
      const cards = await getRelatedLectures({ id, locale, audiences: settings.audiences })

      return relatedAnswer(cards && relatedLecturesToCards(cards))
    } catch {
      return relatedAnswer(null)
    }
  })
}
