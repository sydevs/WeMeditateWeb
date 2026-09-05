/**
 * Same-origin JSON API routes for client-loaded content.
 *
 * The related-content endpoints (SahajCloud #523) rank by subtle-system-node
 * overlap on the server, and are slow (about 5 to 12 seconds, not cached
 * upstream). Fetching them inside a Vike `data()` hook blocks SSR and trips
 * Vike's slow-hook warning. So instead, the player pages render
 * immediately, and load related content on the client from these routes
 * (see RelatedContentLoader). The routes wrap the same KV-cached fetchers,
 * so the slow upstream call happens at most once per cache window. The
 * browser just waits for it asynchronously.
 *
 * These routes run inside the `contextStorage()` middleware (registered
 * first in entry.ts), so `getCmsContext()` resolves the API key and KV
 * binding normally.
 */

import type { Hono } from 'hono'
import type { CmsEnv } from './cms-context'
import { getRelatedMeditations, getRelatedLectures, getWebConfig } from './cms-client'
import { relatedMeditationsToCards, relatedLecturesToCards } from '../lib/related-content'
import { idSchema } from './validation'
import type { Locale } from './cms-types'

/** Constrain the locale query param to the safe URL charset (default `en`). */
function parseLocale(raw: string | undefined): Locale {
  return (raw && /^[a-z]{2}(-[a-z]{2})?$/i.test(raw) ? raw : 'en') as Locale
}

/** Cache the JSON briefly in the browser and CDN. The heavy work is
 * already KV-cached on the server. stale-while-revalidate keeps repeat
 * views instant. */
const CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=1800'

export function registerApiRoutes(app: Hono<CmsEnv>): void {
  // Meditations related to a lecture (not audience-gated).
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

      c.header('Cache-Control', CACHE_CONTROL)

      return c.json({ items: relatedMeditationsToCards(cards) })
    } catch {
      return c.json({ items: [] })
    }
  })

  // Lectures related to a meditation. Audience-gated: audiences come from
  // the site config. getRelatedLectures returns [] when none are set.
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

      c.header('Cache-Control', CACHE_CONTROL)

      return c.json({ items: relatedLecturesToCards(cards) })
    } catch {
      return c.json({ items: [] })
    }
  })
}
