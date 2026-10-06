/**
 * Reads for the atlas SSR routes under `/map` (issue #62, stage C4).
 *
 * This file is deliberately not part of `sahajcloud-client.ts`. That module is
 * already about 950 lines, and holds only collection reads through the
 * Payload SDK. This file has two custom root endpoints,
 * `GET /api/atlas/seo` and `GET /api/atlas/sitemap`, which belong to no
 * collection, so the SDK cannot express them. The seo read goes through
 * `sahajCloudFetch` (`server/sahajcloud-fetch.ts`), the one helper every
 * custom-endpoint read shares. The sitemap read still assembles its own,
 * and is not yet converted.
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
import { getSahajCloudContext } from './sahajcloud-context'
import { sahajCloudFetchOptional } from './sahajcloud-fetch'
import { withRetry } from './error-utils'
import type { Locale } from './sahajcloud-types'
import type { AtlasSeoResponse, AtlasSitemapResponse } from './atlas-types'
import type { SitemapUrl } from './sitemap'
import { parseAtlasRoute } from '../lib/atlas-route'

/**
 * Gets the SEO document for one atlas route, or `null` when there is
 * nothing to render server-side.
 *
 * The atlas root is a described route like any other: `/map` and the bare view
 * routes resolve to SahajCloud's `type: 'root'` answer (#64).
 *
 * `null` covers three different situations. All three render the same way:
 * the widget on its own, with the site's default metadata.
 *
 * - The string is not a route at all — over the length or segment ceiling,
 *   or carrying a query or fragment. {@link parseAtlasRoute} returns null,
 *   and this function never calls out.
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

  // Not a failure, and not a document either: a string this site refuses to
  // read names nothing upstream to ask about.
  if (!target) {
    return null
  }

  // The root's many spellings are one document, and the edge in front of
  // SahajCloud keys on the whole URL, so asking for `/` keeps a crawler
  // grinding through `/map/search` and `/map/calendar` to one cache entry
  // rather than one per spelling. Only the root is collapsed; a view route
  // under a region still asks for the spelling it was given.
  const upstreamRoute = target.kind === 'root' ? '/' : options.route

  try {
    // A 404 means the route named nothing upstream: a stale inbound link, or
    // a region that has since been unpublished. `sahajCloudFetchOptional` answers it
    // with `null`, which reads the same as the no-target case above.
    const answer = await withRetry(() =>
      sahajCloudFetchOptional<AtlasSeoResponse>(
        `/api/atlas/seo?route=${encodeURIComponent(upstreamRoute)}` +
          `&locale=${encodeURIComponent(options.locale)}`,
        `getAtlasSeo(${upstreamRoute})`,
      ),
    )

    // The root answer is built from a global rather than a document, so it has
    // nothing to go missing: a 404 here means the atlas root is misconfigured
    // upstream, not that an inbound link went stale. Left silent it restores
    // the undescribed `/map` of #64 with nothing to say why.
    if (!answer && target.kind === 'root') {
      Sentry.captureMessage('getAtlasSeo got no document for the atlas root', {
        level: 'warning',
        tags: { source: 'getAtlasSeo' },
        extra: { askedFor: options.route, locale: options.locale },
      })
    }

    return answer
  } catch (error) {
    // Crawlers and no-JS visitors rely on the server-rendered half. The
    // widget still works without it. Losing it must not take the page down.
    console.warn(`[getAtlasSeo] degrading to widget-only for ${upstreamRoute}:`, error)
    Sentry.captureMessage('getAtlasSeo failed; rendering the atlas without server content', {
      level: 'warning',
      tags: { source: 'getAtlasSeo' },
      // Both: the request carries the normalized route, so an event naming
      // only the asked-for one cannot be matched to the failing URL.
      extra: {
        route: upstreamRoute,
        askedFor: options.route,
        locale: options.locale,
        target: target.kind,
      },
    })

    return null
  }
}

/**
 * The most atlas URLs one sitemap carries.
 *
 * This bounds the document, not the Worker: `response.json()` has already
 * materialised every row by the time the cap applies. 50,000 URLs is the
 * sitemap spec's own per-file limit, and the margin leaves room for the
 * content half, which shares the file. Crossing the cap is reported rather
 * than silent — an unnoticed truncation is the whole of #123.
 */
const SITEMAP_URL_CAP = 45_000

/**
 * Every atlas URL this site is the canonical home of.
 *
 * Ownership is resolved upstream. `GET /api/atlas/sitemap` answers with the
 * URLs the calling API key's client owns, so the nearest-ancestor walk stays
 * in its single implementation (#640, #650) and this Worker reads no
 * document it will discard (#123).
 *
 * The origin check is a guard, not the selection: it holds the sitemap to
 * the host actually serving the request, so a key whose client canonicalizes
 * elsewhere cannot publish that site's URLs here.
 *
 * Degrades to `[]` on any failure. A sitemap missing its atlas half still
 * serves the rest of the site.
 *
 * @param origin - The origin serving the request, e.g. `https://wemeditate.com`
 */
export async function getAtlasSitemapUrls(origin: string): Promise<SitemapUrl[]> {
  try {
    return await withRetry(async () => {
      const { apiKey, baseURL } = getSahajCloudContext()
      const url = `${baseURL}/api/atlas/sitemap`

      const response = await fetch(url, {
        headers: { Authorization: `clients API-Key ${apiKey}` },
      })

      console.log(`[PayloadCMS] GET ${url} → ${response.status}`)

      if (!response.ok) {
        // The status rides on the error because `detectErrorType` reads it
        // structurally and only falls back to matching `50[0-9]` in the
        // message. A Cloudflare-origin 5xx — 520, 522, 524 — would otherwise
        // classify as UNKNOWN and lose the retry it most needs.
        throw Object.assign(new Error(`getAtlasSitemapUrls failed: ${response.status}`), {
          status: response.status,
        })
      }

      const body = (await response.json()) as AtlasSitemapResponse

      // A 200 whose shape drifted reads exactly like a client that owns no
      // subtree, so it would empty the atlas half with nothing logged. These
      // types are hand-mirrored, which is precisely what `pnpm types:cms`
      // cannot catch.
      if (!Array.isArray(body?.urls)) {
        throw new Error('getAtlasSitemapUrls: the response carried no urls array')
      }

      const rows = body.urls
      const owned = rows.filter(
        (row) => typeof row?.loc === 'string' && row.loc.startsWith(`${origin}/`),
      )

      // Upstream named URLs and the guard rejected every one: this key's
      // client canonicalizes to some other host. Left silent it is an empty
      // atlas section, which reads exactly like owning nothing.
      if (rows.length > 0 && owned.length === 0) {
        Sentry.captureMessage('getAtlasSitemapUrls dropped every URL as off-origin', {
          level: 'warning',
          tags: { source: 'getAtlasSitemapUrls' },
          extra: { origin, returned: rows.length, sample: rows[0]?.loc ?? null },
        })
      }

      if (owned.length > SITEMAP_URL_CAP) {
        Sentry.captureMessage('getAtlasSitemapUrls hit the sitemap cap; atlas URLs are truncated', {
          level: 'warning',
          tags: { source: 'getAtlasSitemapUrls' },
          extra: { origin, owned: owned.length, cap: SITEMAP_URL_CAP },
        })
      }

      return owned
        .slice(0, SITEMAP_URL_CAP)
        .map((row) => ({ loc: row.loc, lastmod: row.lastmod ?? null }))
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
