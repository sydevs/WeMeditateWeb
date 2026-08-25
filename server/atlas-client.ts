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
 * `.claude/docs/local-environment.md` describes for a stale key, and the same
 * remedy: verify against the deployed preview.
 *
 * A 403 must therefore degrade rather than 500 — an atlas page still renders its
 * widget and its own `<head>`; it just loses the server-rendered half.
 */

import * as Sentry from '@sentry/react'
import { getCmsContext } from './cms-context'
import { generateCacheKey, withCache } from './kv-cache'
import type { Locale } from './cms-types'
import type { AtlasSeoResponse } from './atlas-types'
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
        // that has since been unpublished. Cached like any other answer so a
        // crawler working through dead links doesn't re-ask every time.
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
