/**
 * `/robots.txt` and `/sitemap.xml`.
 *
 * This app shipped with neither, so nothing on it was discoverable except
 * by following links. The `/map` routes (#62) exist to be indexable, so
 * they need a sitemap to be worth adding.
 *
 * Registered beside `registerApiRoutes`, and, like it, inside the
 * `contextStorage()` middleware, so `getCmsContext()` resolves the API
 * key and KV binding normally. Both routes are declared before Vike's
 * handler, so they win over the page catch-all.
 *
 * Every read here degrades to empty, instead of failing the response. A
 * partial sitemap is still useful, and some crawlers read a 500 on
 * `/robots.txt` as "crawl nothing".
 */

import type { Hono } from 'hono'
import type { CmsEnv } from './cms-context'
import { createPayloadClient } from './payload-client'
import { getAtlasSitemapUrls } from './atlas-client'
import { buildRobotsTxt, buildSitemapXml, isIndexableHost, type SitemapUrl } from './sitemap'
import { generateCacheKey, withCache, CacheTTL } from './kv-cache'
import type { PagesSelect, MeditationsSelect, LecturesSelect } from './payload-types'

/** Bounded for the same reason as the atlas read: this runs in a Worker request. */
const CONTENT_READ_LIMIT = 500

/**
 * Field selections for the sitemap reads.
 *
 * Typed against the generated `*Select` interfaces, per
 * `server/AGENTS.md`: `select` is mandatory for API clients. Typing it
 * here turns a CMS schema change into a compile error, instead of a
 * silent 400 at runtime. `updatedAt` feeds `<lastmod>`. Every doc carries
 * its id regardless of the selection.
 */
const PAGE_SITEMAP_SELECT = { slug: true, updatedAt: true } satisfies PagesSelect<true>
const MEDITATION_SITEMAP_SELECT = { updatedAt: true } satisfies MeditationsSelect<true>
const LECTURE_SITEMAP_SELECT = { updatedAt: true } satisfies LecturesSelect<true>

/** Cache the rendered documents at the edge. The reads behind them are KV-cached too. */
const SITEMAP_CACHE_CONTROL = 'public, max-age=3600, stale-while-revalidate=86400'

/** `updatedAt` as a `<lastmod>` value, or null when the row has none. */
function lastmodOf(doc: { updatedAt?: string | null }): string | null {
  return typeof doc.updatedAt === 'string' ? doc.updatedAt : null
}

/**
 * Site-content URLs (pages, meditations, and lectures) in the default
 * locale.
 *
 * The path shapes mirror `ROUTE_BUILDERS` in `lib/cms-routes.ts`, which
 * owns the inverse direction (`/:slug`, `/meditations/:id`,
 * `/lectures/:id`).
 *
 * Locale variants are deliberately not listed yet. The site serves ten
 * locales, and doing this properly means an `xhtml:link` alternate per
 * entry, not ten times the rows. This is worth doing, as separate work.
 */
async function getContentSitemapUrls(origin: string): Promise<SitemapUrl[]> {
  try {
    return await withCache({
      cacheKey: generateCacheKey('content-sitemap', { origin }),
      ttl: CacheTTL.LIST,
      fetchFn: async () => {
        const client = createPayloadClient()
        const read = { limit: CONTENT_READ_LIMIT, depth: 0, locale: 'en' as const }

        const [pages, meditations, lectures] = await Promise.all([
          client.find({ collection: 'pages', ...read, select: PAGE_SITEMAP_SELECT }),
          client.find({ collection: 'meditations', ...read, select: MEDITATION_SITEMAP_SELECT }),
          client.find({ collection: 'lectures', ...read, select: LECTURE_SITEMAP_SELECT }),
        ])

        return [
          // An unpublished page returns with no slug. It has no URL to list.
          ...(pages?.docs ?? [])
            .filter((doc) => typeof doc.slug === 'string' && doc.slug.length > 0)
            .map((doc) => ({ loc: `${origin}/${doc.slug}`, lastmod: lastmodOf(doc) })),
          ...(meditations?.docs ?? []).map((doc) => ({
            loc: `${origin}/meditations/${doc.id}`,
            lastmod: lastmodOf(doc),
          })),
          ...(lectures?.docs ?? []).map((doc) => ({
            loc: `${origin}/lectures/${doc.id}`,
            lastmod: lastmodOf(doc),
          })),
        ]
      },
    })
  } catch (error) {
    // A sitemap that lists less than everything still helps. One that 500s does not.
    console.warn('[getContentSitemapUrls] omitting site content from the sitemap:', error)

    return []
  }
}

export function registerSitemapRoutes(app: Hono<CmsEnv>): void {
  app.get('/robots.txt', (c) => {
    const origin = new URL(c.req.url).origin

    c.header('Content-Type', 'text/plain; charset=utf-8')
    c.header('Cache-Control', SITEMAP_CACHE_CONTROL)

    return c.body(buildRobotsTxt(origin))
  })

  app.get('/sitemap.xml', async (c) => {
    const origin = new URL(c.req.url).origin

    // A preview origin already tells crawlers to stay out. Serving it a
    // full sitemap would only invite the indexing that robots.txt just refused.
    if (!isIndexableHost(new URL(origin).hostname)) {
      c.header('Content-Type', 'application/xml; charset=utf-8')

      return c.body(buildSitemapXml([]))
    }

    const [content, atlas] = await Promise.all([
      getContentSitemapUrls(origin),
      getAtlasSitemapUrls(origin),
    ])

    c.header('Content-Type', 'application/xml; charset=utf-8')
    c.header('Cache-Control', SITEMAP_CACHE_CONTROL)

    return c.body(buildSitemapXml([{ loc: `${origin}/` }, ...content, ...atlas]))
  })
}
