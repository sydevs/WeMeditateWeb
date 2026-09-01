/**
 * Reads for the atlas SSR routes under `/map` (issue #62, stage C4).
 *
 * Deliberately **not** part of `cms-client.ts`: that module is already ~950
 * lines and is entirely collection reads through the Payload SDK. This is one
 * custom root endpoint, `GET /api/atlas/seo`, which the SDK cannot express — it
 * belongs to no collection — so it is a plain `fetch`, matching the pattern the
 * related-content readers in `cms-client.ts` already use for custom endpoints.
 *
 * ## Access
 *
 * The endpoint is gated on the `sahaj-atlas-client` role: `regions` and `events`
 * belong to the Sahaj Atlas project, and a client without that role gets a 403
 * (SahajCloud #646). Production's **We Meditate Web** client holds it. The
 * separate **We Meditate Web (LOCAL)** client used by `.env.local` does not, so
 * these reads 403 in local dev while working on the deploy — the same asymmetry
 * `docs/local-environment.md` describes for a stale key, and the same
 * remedy: verify against the deployed preview.
 *
 * A 403 must therefore degrade rather than 500 — an atlas page still renders its
 * widget and its own `<head>`; it just loses the server-rendered half.
 */

import * as Sentry from '@sentry/react'
import { getCmsContext } from './cms-context'
import { generateCacheKey, withCache } from './kv-cache'
import { createPayloadClient } from './payload-client'
import type { Locale } from './cms-types'
import type { AtlasSeoResponse } from './atlas-types'
import type { SitemapUrl } from './sitemap'
import type { RegionsSelect, EventsSelect } from './payload-types'
import { parseAtlasRoute } from '../lib/atlas-route'

/**
 * Cache lifetimes, per the ticket.
 *
 * A region's identity — its name, its place in the tree, its canonical — barely
 * moves, and its listing is already capped and sorted upstream so the body is
 * byte-stable. A class's schedule, address and dormancy change far more often,
 * and a stale class is the failure a seeker actually feels: turning up to a
 * class that has moved. Hence the shorter window on events.
 */
export const AtlasCacheTTL = {
  /** Region routes (1 hour). */
  REGION: 3600,
  /** Event routes (15 minutes). */
  EVENT: 900,
} as const

/**
 * Fetch the SEO document for one atlas route, or `null` when there is nothing
 * to render server-side.
 *
 * `null` covers three genuinely different situations, all of which render the
 * same way — the widget on its own, with our own landing metadata:
 *
 * - the route names no document (the atlas root `/`, a bare `/search` view), so
 *   {@link parseAtlasRoute} returns null and we never make the call;
 * - the route named a document that no longer resolves upstream (404);
 * - the read failed or was refused (403 in local dev, a network fault, a 5xx).
 *
 * Only the last is reported to Sentry: the first is normal routing and the
 * second is an ordinary stale link.
 *
 * @param options.route - The atlas route, e.g. `/nl/amsterdam` or `/gb/london/1204`
 * @param options.locale - Locale for the answer's rendering
 */
export async function getAtlasSeo(options: {
  route: string
  locale: Locale
}): Promise<AtlasSeoResponse | null> {
  const target = parseAtlasRoute(options.route)

  // Not a failure: the atlas landing page and bare view routes have no upstream
  // document to describe. Skipping the call also keeps a crawler hammering
  // `/map/search` off the endpoint entirely.
  if (!target) {
    return null
  }

  const ttl = target.kind === 'event' ? AtlasCacheTTL.EVENT : AtlasCacheTTL.REGION

  // Keyed on the *parsed* target rather than the raw route, so the many URLs
  // that name one document — `/gb/london`, `/regions/gb/london`,
  // `/wrong/chain/london`, `/gb/london/calendar` — share a single cache entry
  // instead of one each.
  const cacheKey = generateCacheKey('atlas-seo', {
    target: target.kind === 'event' ? `event:${target.id}` : `region:${target.slug}`,
    locale: options.locale,
  })

  try {
    return await withCache({
      cacheKey,
      ttl,
      fetchFn: async () => {
        const { apiKey, baseURL } = getCmsContext()
        const url =
          `${baseURL}/api/atlas/seo?route=${encodeURIComponent(options.route)}` +
          `&locale=${encodeURIComponent(options.locale)}`

        const response = await fetch(url, {
          headers: { Authorization: `clients API-Key ${apiKey}` },
        })

        console.log(`[PayloadCMS] GET ${url} → ${response.status}`)

        // The route named nothing upstream — a stale inbound link, or a region
        // that has since been unpublished.
        //
        // ⚠ This answer is **not** effectively cached: `withCache` stores it,
        // but reads a stored `null` back as a cache miss, so every request for a
        // dead route re-queries the CMS. Acceptable — a 404 costs one cheap
        // upstream read and dead atlas routes are rare — but it is not the
        // cached path the successful branch takes, and a crawler grinding
        // through stale links will reach the CMS each time.
        if (response.status === 404) {
          return null
        }

        if (!response.ok) {
          throw new Error(`getAtlasSeo(${options.route}) failed: ${response.status}`)
        }

        return (await response.json()) as AtlasSeoResponse
      },
    })
  } catch (error) {
    // The server-rendered half is what crawlers and no-JS visitors get; the
    // widget still works without it. Losing it must not take the page down.
    console.warn(`[getAtlasSeo] degrading to widget-only for ${options.route}:`, error)
    Sentry.captureMessage('getAtlasSeo failed; rendering the atlas without server content', {
      level: 'warning',
      tags: { source: 'getAtlasSeo' },
      extra: { route: options.route, locale: options.locale, target: target.kind },
    })

    return null
  }
}

/**
 * How many documents a sitemap read will walk before giving up.
 *
 * The atlas is ~600 regions and ~650 classes, so this is roughly a threefold
 * headroom. It exists because this runs inside a Worker request: an unbounded
 * paginated read is one CMS data change away from a timeout, and a sitemap that
 * is missing its tail is far better than a route that hangs.
 */
const SITEMAP_READ_LIMIT = 500
const SITEMAP_MAX_PAGES = 4

/**
 * Field selections for the atlas sitemap reads.
 *
 * Typed against the generated `*Select` interfaces per
 * `server/AGENTS.md`: `select` is mandatory for API clients, and
 * typing it means a CMS schema change surfaces here as a compile error rather
 * than a silent 400. The two are structurally identical today and still declared
 * separately, because they are answerable to different collections.
 *
 * `webUrl` is a virtual field deriving from the document id alone, so nothing
 * extra has to be co-selected for it to resolve.
 */
const SITEMAP_SELECTS = {
  regions: { webUrl: true, updatedAt: true } satisfies RegionsSelect<true>,
  events: { webUrl: true, updatedAt: true } satisfies EventsSelect<true>,
}

/** A row either sitemap read can yield. */
type SitemapDoc = { webUrl?: string | null; updatedAt?: string | null }

/**
 * Every atlas URL this site is the canonical home of.
 *
 * **Filtered to our own origin, deliberately.** A sitemap is a list of the URLs
 * you are claiming, and atlas ownership is per-subtree: most regions canonicalize
 * to the national site that owns them (#640). Listing those would ask a crawler
 * to index URLs we ourselves declare non-canonical. So we return the `webUrl`
 * values already on this origin — the regions and classes that fall back to the
 * We Meditate surface, which is exactly the set these routes are the safety net
 * for.
 *
 * That also makes the answer self-adjusting: on a preview origin, and before the
 * wemeditate.com cutover, it is legitimately empty.
 *
 * Degrades to `[]` on any failure — a sitemap missing its atlas half still
 * serves the rest of the site.
 *
 * @param origin - The origin serving the request, e.g. `https://wemeditate.com`
 */
export async function getAtlasSitemapUrls(origin: string): Promise<SitemapUrl[]> {
  try {
    return await withCache({
      cacheKey: generateCacheKey('atlas-sitemap', { origin }),
      ttl: AtlasCacheTTL.REGION,
      fetchFn: async () => {
        const client = createPayloadClient()

        const found = await Promise.all([
          readAllPages(client, 'regions'),
          readAllPages(client, 'events'),
        ])

        const prefix = `${origin.replace(/\/$/, '')}/`

        return found
          .flat()
          .filter(
            (doc): doc is SitemapDoc & { webUrl: string } =>
              typeof doc.webUrl === 'string' && doc.webUrl.startsWith(prefix),
          )
          .map((doc) => ({ loc: doc.webUrl, lastmod: doc.updatedAt ?? null }))
      },
    })
  } catch (error) {
    console.warn('[getAtlasSitemapUrls] omitting the atlas half of the sitemap:', error)
    Sentry.captureMessage('getAtlasSitemapUrls failed; sitemap omits atlas URLs', {
      level: 'warning',
      tags: { source: 'getAtlasSitemapUrls' },
      extra: { origin },
    })

    return []
  }
}

/**
 * Walk a collection's pages up to the read ceiling.
 *
 * Bounded because this runs inside a Worker request: an unbounded paginated read
 * is one CMS data change away from a timeout, and a sitemap missing its tail
 * beats a route that hangs.
 */
async function readAllPages(
  client: ReturnType<typeof createPayloadClient>,
  collection: keyof typeof SITEMAP_SELECTS,
): Promise<SitemapDoc[]> {
  const docs: SitemapDoc[] = []

  for (let page = 1; page <= SITEMAP_MAX_PAGES; page++) {
    const result = await client.find({
      collection,
      limit: SITEMAP_READ_LIMIT,
      page,
      depth: 0,
      select: SITEMAP_SELECTS[collection],
    })

    docs.push(...((result?.docs ?? []) as SitemapDoc[]))

    if (!result?.hasNextPage) {
      break
    }
  }

  return docs
}
