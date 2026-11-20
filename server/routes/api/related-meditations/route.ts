/**
 * `GET /api/related-meditations/:lectureId` — meditations related to a
 * lecture, for the lecture player. Not audience-gated.
 *
 * The related-content endpoints (SahajCloud #523) rank by subtle-system-node
 * overlap on the server, and a cold one is slow (about 5 to 12 seconds).
 * Fetching them inside a Vike `data()` hook blocks SSR and trips Vike's
 * slow-hook warning. So instead, the player pages render immediately, and
 * load related content on the client from this route and
 * `related-lectures/` (see RelatedContentLoader). SahajCloud marks those
 * endpoints edge-cacheable (`publicReadCacheHeaders`), so the slow call is
 * paid once per colo per window. The browser just waits for it asynchronously.
 */

import type { Hono } from 'hono'
import type { SahajCloudEnv } from '../../../sahajcloud-context'
import { getRelatedMeditations } from '../../../sahajcloud-client'
import { idSchema } from '../../../validation'
import { relatedMeditationsToCards } from '../../../../lib/related-content'
import { parseLocale, relatedAnswer } from '../_shared'

export function registerRelatedMeditations(app: Hono<SahajCloudEnv>): void {
  app.get('/api/related-meditations/:lectureId', async (c) => {
    let id: string

    try {
      id = idSchema.parse(c.req.param('lectureId'))
    } catch {
      return c.json({ items: [] }, 400)
    }

    // Related content never 500s. Degrade to an empty section on any failure.
    try {
      const cards = await getRelatedMeditations({ id, locale: parseLocale(c.req.query('locale')) })

      return relatedAnswer(cards && relatedMeditationsToCards(cards))
    } catch {
      return relatedAnswer(null)
    }
  })
}
