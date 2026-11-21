/**
 * `/robots.txt` and `/sitemap.xml`.
 *
 * This app shipped with neither, so nothing on it was discoverable except
 * by following links. The `/map` routes (#62) exist to be indexable, so
 * they need a sitemap to be worth adding.
 *
 * Registered beside `registerRoutes`, and, like it, inside the
 * `contextStorage()` middleware, so `getSahajCloudContext()` resolves the API
 * key normally. Both routes are declared before Vike's handler, so they
 * win over the page catch-all.
 *
 * Every read here degrades to empty, instead of failing the response. A
 * partial sitemap is still useful, and some crawlers read a 500 on
 * `/robots.txt` as "crawl nothing".
 */

import type { Context, Hono } from 'hono'
import type { SahajCloudEnv } from './sahajcloud-context'
import { createPayloadClient } from './payload-client'
import { degrade, warnOnce, withRetry } from './error-utils'
import { getAtlasSitemapUrls } from './atlas-client'
import { getWebConfig, getWebTranslations } from './sahajcloud-client'
import { buildRobotsTxt, buildSitemapXml, isCanonicalOrigin, type SitemapUrl } from './sitemap'
import { buildWebManifest } from './manifest'
import { getT } from '../lib/i18n'
import { localeFromPath } from '../lib/urls'
import { buildAlternates, advertisedLocales } from '../lib/hreflang'
import { DEFAULT_LOCALE, type Locale } from './sahajcloud-types'
import type { PagesSelect, MeditationsSelect, LecturesSelect } from './payload-types'

/** Documents per content read. Each page of a walk is one subrequest. */
const CONTENT_READ_LIMIT = 500

/**
 * Pages one collection's walk may take. The atlas half takes up to 45,000 of
 * the 50,000 URLs one sitemap file may hold (`SITEMAP_URL_CAP`), so the three
 * collections share the other 5,000: 3 × 3 × 500 = 4,500.
 *
 * shortcut: a collection past 1,500 documents (4,500 for all three) is listed
 * to here and reported, so split the sitemap into an index before one gets there.
 */
const MAX_CONTENT_PAGES = 3

/**
 * Field selections for the sitemap reads.
 *
 * Typed against the generated `*Select` interfaces, per
 * `server/AGENTS.md`: `select` is mandatory for API clients. Typing it
 * here turns a SahajCloud schema change into a compile error, instead of a
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

/** Cache the rendered documents at our own edge, for an hour. */
const SITEMAP_CACHE_CONTROL = 'public, max-age=3600, stale-while-revalidate=86400'

/** `updatedAt` as a `<lastmod>` value, or null when the row has none. */
function lastmodOf(doc: { updatedAt?: string | null }): string | null {
  return typeof doc.updatedAt === 'string' ? doc.updatedAt : null
}

/**
 * What the sitemap needs from the site config: the locales it offers, and
 * which page `/` serves.
 *
 * The one read the annotation adds, and cheap in practice: the rendered
 * sitemap carries an hour of `max-age`, and the config read behind it is
 * edge-cached and shared with every page render. A failure degrades to an
 * English-only cluster and an unannotated `/` — never wrong, only less
 * complete.
 */
async function getSiteAnnotation(): Promise<{ offered: Locale[]; homeSlug: string | null }> {
  try {
    const settings = await getWebConfig({ locale: DEFAULT_LOCALE })

    return { offered: settings.availableLocales, homeSlug: settings.homePage?.slug ?? null }
  } catch (error) {
    // Logged, not reported: `getWebConfig`'s own retry already reports this.
    console.warn('[getSiteAnnotation] falling back to English-only alternates:', error)

    return { offered: [DEFAULT_LOCALE], homeSlug: null }
  }
}

/** Every document of one collection, a page at a time, up to the ceiling. */
async function readEvery<T>(
  collection: string,
  readPage: (page: number) => Promise<{ docs?: T[]; hasNextPage?: boolean } | undefined>,
): Promise<T[]> {
  const docs: T[] = []

  for (let page = 1; page <= MAX_CONTENT_PAGES; page++) {
    const result = await readPage(page)

    docs.push(...(result?.docs ?? []))

    if (!result?.hasNextPage) return docs
  }

  console.warn(`[getContentSitemapUrls] ${collection} truncated at ${docs.length} documents`)
  warnOnce(collection, 'Sitemap content read hit its page ceiling; the sitemap is truncated', {
    source: 'getContentSitemapUrls',
    extra: { collection, listed: docs.length },
  })

  return docs
}

/** Every page, meditation and lecture, with what the sitemap lists of each. */
async function readContentDocs() {
  const client = createPayloadClient()
  // Sorted by id so a document created mid-walk lands on the last page,
  // rather than shifting every later page by one.
  const read = { limit: CONTENT_READ_LIMIT, depth: 0, locale: 'en' as const, sort: 'id' }

  const [pages, meditations, lectures] = await Promise.all([
    // `locale: 'all'` makes `_status` arrive as a per-locale map, and adds
    // no query: `slug` and `updatedAt` are not localized, so they come back
    // as plain values in the same response.
    readEvery('pages', (page) =>
      client.find({
        collection: 'pages',
        ...read,
        page,
        locale: 'all',
        select: PAGE_SITEMAP_SELECT,
      }),
    ),
    readEvery('meditations', (page) =>
      client.find({ collection: 'meditations', ...read, page, select: MEDITATION_SITEMAP_SELECT }),
    ),
    readEvery('lectures', (page) =>
      client.find({ collection: 'lectures', ...read, page, select: LECTURE_SITEMAP_SELECT }),
    ),
  ])

  return { pages, meditations, lectures }
}

/**
 * Site-content URLs (pages, meditations, and lectures), each annotated with
 * its `hreflang` cluster.
 *
 * The path shapes mirror `ROUTE_BUILDERS` in `lib/document-routes.ts`, which
 * owns the inverse direction (`/:slug`, `/meditations/:id`,
 * `/lectures/:id`).
 *
 * **One row per document, carrying an `xhtml:link` per locale** — not one
 * row per locale variant. That is what the alternates annotation is for,
 * and the `<head>` of every variant carries the full reciprocal cluster.
 *
 * Meditations and lectures list a bare URL: neither collection opts into
 * per-locale publish state upstream, so neither has a per-document
 * translation claim to make.
 */
async function getContentSitemapUrls(origin: string): Promise<SitemapUrl[]> {
  // A sitemap that lists less than everything still helps. One that 500s
  // does not — and the home page is listable without reading anything.
  const degradation = {
    source: 'getContentSitemapUrls',
    message: 'getContentSitemapUrls failed; sitemap lists only the home page',
    key: origin,
    fallback: [{ loc: `${origin}/` }],
  }

  return degrade(async () => {
    const [{ offered, homeSlug }, docs] = await Promise.all([
      getSiteAnnotation(),
      withRetry(readContentDocs, { reportFailure: false }),
    ])

    // `/` serves the config's `homePage`, so it advertises that page's
    // locales. Its `_status` is already in the list read above — there is
    // no second read for the home page.
    const home = homeSlug ? docs.pages.find((doc) => doc.slug === homeSlug) : undefined
    const cluster = (path: string, status: unknown) =>
      buildAlternates({ origin, path, locales: advertisedLocales(status, offered) })

    return [
      {
        loc: `${origin}/`,
        lastmod: home ? lastmodOf(home) : null,
        alternates: cluster('/', home?._status),
      },
      // An unpublished page returns with no slug. It has no URL to list.
      //
      // The home document is listed once, as `/`. `pages/[slug]/+data.ts`
      // 302s `/${homeSlug}` there, and a sitemap that listed a redirect
      // would hand a crawler two URLs for one document — the
      // duplicate-content shape this annotation exists to avoid.
      ...docs.pages
        .filter((doc) => typeof doc.slug === 'string' && doc.slug.length > 0)
        .filter((doc) => doc !== home)
        .map((doc) => ({
          loc: `${origin}/${doc.slug}`,
          lastmod: lastmodOf(doc),
          alternates: cluster(`/${doc.slug}`, doc._status),
        })),
      ...docs.meditations.map((doc) => ({
        loc: `${origin}/meditations/${doc.id}`,
        lastmod: lastmodOf(doc),
      })),
      ...docs.lectures.map((doc) => ({
        loc: `${origin}/lectures/${doc.id}`,
        lastmod: lastmodOf(doc),
      })),
    ]
  }, degradation)
}

/** `/manifest.webmanifest`, and its locale-prefixed spelling. */
const manifestHandler = async (c: Context<SahajCloudEnv>) => {
  const { origin, pathname } = new URL(c.req.url)
  const { locale } = localeFromPath(pathname)
  const t = getT(await getWebTranslations({ locale }), locale)

  c.header('Content-Type', 'application/manifest+json; charset=utf-8')
  c.header('Cache-Control', SITEMAP_CACHE_CONTROL)

  // ⚠ `c.json()` replaces the Content-Type with `application/json`, whatever
  // was set before it. The spec's own type is what a browser installs a
  // manifest by, so the body is serialized here, as `/robots.txt` does.
  return c.body(JSON.stringify(buildWebManifest({ origin, locale, t })))
}

export function registerSitemapRoutes(app: Hono<SahajCloudEnv>): void {
  // Two paths, one handler: the link in the head is locale-prefixed, so the
  // manifest is in the language of the page that named it, and the bare path
  // still answers for anything that guesses it.
  app.get('/:locale{[a-z]{2}(?:-[A-Z]{2})?}/manifest.webmanifest', manifestHandler)
  app.get('/manifest.webmanifest', manifestHandler)
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
    if (!isCanonicalOrigin(origin)) {
      c.header('Content-Type', 'application/xml; charset=utf-8')

      return c.body(buildSitemapXml([]))
    }

    const [content, atlas] = await Promise.all([
      getContentSitemapUrls(origin),
      getAtlasSitemapUrls(origin),
    ])

    c.header('Content-Type', 'application/xml; charset=utf-8')
    c.header('Cache-Control', SITEMAP_CACHE_CONTROL)

    return c.body(buildSitemapXml([...content, ...atlas]))
  })
}
