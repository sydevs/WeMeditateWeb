/**
 * Reads for the atlas SSR routes under `/map` (issue #62, stage C4).
 *
 * This file is deliberately not part of `cms-client.ts`. That module is
 * already about 950 lines, and holds only collection reads through the
 * Payload SDK. This file has one custom root endpoint,
 * `GET /api/atlas/seo`, which belongs to no collection, so the SDK cannot
 * express it. It reads through `cmsFetch` (`server/cms-fetch.ts`), the one
 * helper every custom-endpoint read shares.
 *
 * ## Access
 *
 * The endpoint requires the `sahaj-atlas-client` role: `regions` and
 * `events` belong to the Sahaj Atlas project, and a client without that
 * role gets a 403 (SahajCloud #646). Production's We Meditate Web client
 * holds this role. The separate We Meditate Web (LOCAL) client, used by
 * `.env.local`, does not. So these reads 403 in local dev, while they work
 * on the deploy. This is the same asymmetry `docs/local-environment.md`
 * describes for a stale key, with the same remedy: verify against the
 * deployed preview.
 *
 * A 403 must therefore degrade, not 500. An atlas page still renders its
 * widget and its own `<head>`. It only loses the server-rendered half.
 */

import * as Sentry from '@sentry/react'
import { cmsFetchOptional } from './cms-fetch'
import { withRetry } from './error-utils'
import { createPayloadClient } from './payload-client'
import type { Locale } from './cms-types'
import type { AtlasSeoResponse } from './atlas-types'
import type { SitemapUrl } from './sitemap'
import type { RegionsSelect, EventsSelect } from './payload-types'
import { parseAtlasRoute } from '../lib/atlas-route'

/**
 * Gets the SEO document for one atlas route, or `null` when there is
 * nothing to render server-side.
 *
 * `null` covers three different situations. All three render the same way:
 * the widget on its own, with default landing metadata.
 *
 * - The route names no document (the atlas root `/`, or a bare `/search`
 *   view). {@link parseAtlasRoute} returns null, and this function never
 *   calls out.
 * - The route named a document that no longer resolves upstream (404).
 * - The read failed or was refused (403 in local dev, a network fault, a
 *   5xx).
 *
 * Only the last case is reported to Sentry. The first is normal routing.
 * The second is an ordinary stale link.
 *
 * @param options.route - The atlas route, e.g. `/nl/amsterdam` or `/gb/london/1204`
 * @param options.locale - Locale for the answer's rendering
 */
export async function getAtlasSeo(options: {
  route: string
  locale: Locale
}): Promise<AtlasSeoResponse | null> {
  const target = parseAtlasRoute(options.route)

  // Not a failure. The atlas landing page and bare view routes have no
  // upstream document to describe. Skipping the call also stops a crawler
  // that repeatedly requests `/map/search` from reaching the endpoint.
  if (!target) {
    return null
  }

  try {
    // A 404 means the route named nothing upstream: a stale inbound link, or
    // a region that has since been unpublished. `cmsFetchOptional` answers it
    // with `null`, which reads the same as the no-target case above.
    return await withRetry(() =>
      cmsFetchOptional<AtlasSeoResponse>(
        `/api/atlas/seo?route=${encodeURIComponent(options.route)}` +
          `&locale=${encodeURIComponent(options.locale)}`,
        `getAtlasSeo(${options.route})`,
      ),
    )
  } catch (error) {
    // Crawlers and no-JS visitors rely on the server-rendered half. The
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
 * How many documents a sitemap read walks before it stops.
 *
 * The atlas holds about 600 regions and about 650 classes, so this gives
 * roughly threefold headroom. This limit exists because the read runs
 * inside a Worker request. An unbounded paginated read is one CMS data
 * change away from a timeout. A sitemap missing its tail is far better than
 * a route that hangs.
 */
const SITEMAP_READ_LIMIT = 500
const SITEMAP_MAX_PAGES = 4

/**
 * Field selections for the atlas sitemap reads.
 *
 * Typed against the generated `*Select` interfaces, per
 * `server/AGENTS.md`: `select` is mandatory for API clients. Typing it
 * turns a CMS schema change into a compile error here, instead of a silent
 * 400. The two selects are structurally identical today. They stay
 * declared separately because they answer to different collections.
 *
 * `webUrl` is a virtual field, derived from the document ID alone. Nothing
 * extra needs selecting for it to resolve.
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
 * Filtered to this site's own origin, on purpose. A sitemap lists the URLs
 * a site claims. Atlas ownership works per subtree: most regions
 * canonicalize to the national site that owns them (#640). Listing those
 * would ask a crawler to index URLs this site itself marks non-canonical.
 * So this function returns only the `webUrl` values already on this
 * origin: the regions and classes that fall back to the We Meditate
 * surface. This is exactly the set these routes exist to serve as a safety
 * net for.
 *
 * This also makes the answer self-adjusting. On a preview origin, and
 * before the wemeditate.com cutover, the list is legitimately empty.
 *
 * Degrades to `[]` on any failure. A sitemap missing its atlas half still
 * serves the rest of the site.
 *
 * @param origin - The origin serving the request, e.g. `https://wemeditate.com`
 */
export async function getAtlasSitemapUrls(origin: string): Promise<SitemapUrl[]> {
  try {
    return await withRetry(async () => {
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
 * Walks a collection's pages up to the read ceiling. See SITEMAP_READ_LIMIT
 * for why the ceiling exists.
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
