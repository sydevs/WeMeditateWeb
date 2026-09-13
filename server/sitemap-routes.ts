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
import { getWebConfig } from './cms-client'
import { buildRobotsTxt, buildSitemapXml, isIndexableHost, type SitemapUrl } from './sitemap'
import { generateCacheKey, withCache, CacheTTL } from './kv-cache'
import { buildAlternates, advertisedLocales } from '../lib/hreflang'
import { DEFAULT_LOCALE, type Locale } from './cms-types'
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
const PAGE_SITEMAP_SELECT = {
  slug: true,
  updatedAt: true,
  _status: true,
} satisfies PagesSelect<true>
const MEDITATION_SITEMAP_SELECT = { updatedAt: true } satisfies MeditationsSelect<true>
const LECTURE_SITEMAP_SELECT = { updatedAt: true } satisfies LecturesSelect<true>

/** Cache the rendered documents at the edge. The reads behind them are KV-cached too. */
const SITEMAP_CACHE_CONTROL = 'public, max-age=3600, stale-while-revalidate=86400'

/** `updatedAt` as a `<lastmod>` value, or null when the row has none. */
function lastmodOf(doc: { updatedAt?: string | null }): string | null {
  return typeof doc.updatedAt === 'string' ? doc.updatedAt : null
}

/**
 * What the sitemap needs from the site config: the locales it offers, and
 * which page `/` serves.
 *
 * This is the one read the annotation adds. It is cheap in practice:
 * `getWebConfig` is KV-cached for 24 h and every page render reads it too,
 * so this shares one entry with them rather than adding load. A failure
 * degrades to an English-only cluster and an unannotated `/`, which is
 * never wrong — only less complete.
 */
async function getSiteAnnotation(): Promise<{ offered: Locale[]; homeSlug: string | null }> {
  try {
    const settings = await getWebConfig({ locale: DEFAULT_LOCALE })

    return {
      offered: settings.availableLocales,
      homeSlug: typeof settings.homePage?.slug === 'string' ? settings.homePage.slug : null,
    }
  } catch (error) {
    console.warn('[getSiteAnnotation] falling back to English-only alternates:', error)

    return { offered: [DEFAULT_LOCALE], homeSlug: null }
  }
}

/**
 * Site-content URLs (pages, meditations, and lectures), each annotated with
 * its `hreflang` cluster.
 *
 * The path shapes mirror `ROUTE_BUILDERS` in `lib/cms-routes.ts`, which
 * owns the inverse direction (`/:slug`, `/meditations/:id`,
 * `/lectures/:id`).
 *
 * **One row per document, carrying an `xhtml:link` per locale** — not one
 * row per locale variant. That is what the alternates annotation is for,
 * and the `<head>` of every variant carries the full reciprocal cluster.
 *
 * The pages read is the one that changed: `locale: 'all'` makes `_status`
 * arrive as a per-locale map. It adds no query — `slug` and `updatedAt`
 * are not localized, so they come back as plain values in the same
 * response. Meditations and lectures stay on the default locale: neither
 * collection opts into per-locale publish state upstream, so neither has a
 * per-document translation claim to make, and both list a bare URL.
 */
async function getContentSitemapUrls(
  origin: string,
  annotation: { offered: Locale[]; homeSlug: string | null },
): Promise<SitemapUrl[]> {
  const { offered, homeSlug } = annotation

  try {
    return await withCache({
      cacheKey: generateCacheKey('content-sitemap', {
        origin,
        offered: offered.join(','),
        homeSlug: homeSlug ?? '',
      }),
      ttl: CacheTTL.LIST,
      fetchFn: async () => {
        const client = createPayloadClient()
        const read = { limit: CONTENT_READ_LIMIT, depth: 0, locale: 'en' as const }

        const [pages, meditations, lectures] = await Promise.all([
          client.find({
            collection: 'pages',
            limit: CONTENT_READ_LIMIT,
            depth: 0,
            // See `getPageAdvertisedLocales`: `all` asks for the per-locale
            // `_status` map. `slug` and `updatedAt` are not localized, so
            // this stays one query returning plain values for both.
            locale: 'all' as unknown as Locale,
            select: PAGE_SITEMAP_SELECT,
          }),
          client.find({ collection: 'meditations', ...read, select: MEDITATION_SITEMAP_SELECT }),
          client.find({ collection: 'lectures', ...read, select: LECTURE_SITEMAP_SELECT }),
        ])

        const pageDocs = pages?.docs ?? []
        // `/` serves the config's `homePage`, so it advertises that page's
        // locales. Its `_status` is already in the list read above — there
        // is no second read for the home page.
        const home = pageDocs.find((doc) => homeSlug !== null && doc.slug === homeSlug)

        return [
          {
            loc: `${origin}/`,
            alternates: buildAlternates({
              origin,
              path: '/',
              locales: home ? advertisedLocales(home._status, offered) : [],
            }),
          },
          // An unpublished page returns with no slug. It has no URL to list.
          ...pageDocs
            .filter((doc) => typeof doc.slug === 'string' && doc.slug.length > 0)
            .map((doc) => ({
              loc: `${origin}/${doc.slug}`,
              lastmod: lastmodOf(doc),
              alternates: buildAlternates({
                origin,
                path: `/${doc.slug}`,
                locales: advertisedLocales(doc._status, offered),
              }),
            })),
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

    // The content read needs the locale set to filter each document's
    // cluster with, so it waits on the config. The atlas read does not, and
    // still runs alongside it.
    const [annotation, atlas] = await Promise.all([getSiteAnnotation(), getAtlasSitemapUrls(origin)])
    const content = await getContentSitemapUrls(origin, annotation)

    c.header('Content-Type', 'application/xml; charset=utf-8')
    c.header('Cache-Control', SITEMAP_CACHE_CONTROL)

    // `/` last, not first: `getContentSitemapUrls` returns an annotated `/`
    // row of its own, `buildSitemapXml` keeps the first occurrence of a
    // URL, and so this bare row survives only when the content read
    // degraded to nothing. The home page stays listed either way.
    return c.body(buildSitemapXml([...content, ...atlas, { loc: `${origin}/` }]))
  })
}
