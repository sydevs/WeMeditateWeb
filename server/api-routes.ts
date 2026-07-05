/**
 * Same-origin JSON API routes for client-loaded content.
 *
 * The related-content endpoints (SahajCloud #523) rank by subtle-system-node
 * overlap server-side and are **slow** (~5–12s, not server-cached upstream).
 * Fetching them inside a Vike `data()` hook blocks SSR and trips Vike's slow-
 * hook warning, so instead the player pages render immediately and load related
 * content **client-side** from these routes (see RelatedContentLoader). The
 * routes wrap the same KV-cached fetchers, so the slow upstream call happens at
 * most once per cache window; the browser just waits asynchronously for it.
 *
 * These run inside the `contextStorage()` middleware (registered first in
 * entry.ts), so `getCmsContext()` resolves the API key / KV binding normally.
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

/** Cache the JSON briefly in the browser/CDN; the heavy work is already KV-cached
 * server-side. stale-while-revalidate keeps repeat views instant. */
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
    const cards = await getRelatedMeditations({ id, locale: parseLocale(c.req.query('locale')) })

    c.header('Cache-Control', CACHE_CONTROL)

    return c.json({ items: relatedMeditationsToCards(cards) })
  })

  // Lectures related to a meditation (audience-gated: audiences come from the
  // site config; getRelatedLectures short-circuits to [] when none are set).
  app.get('/api/related-lectures/:meditationId', async (c) => {
    let id: string

    try {
      id = idSchema.parse(c.req.param('meditationId'))
    } catch {
      return c.json({ items: [] }, 400)
    }
    const locale = parseLocale(c.req.query('locale'))
    const settings = await getWebConfig({ locale })
    const cards = await getRelatedLectures({ id, locale, audiences: settings.audiences })

    c.header('Cache-Control', CACHE_CONTROL)

    return c.json({ items: relatedLecturesToCards(cards) })
  })
}
