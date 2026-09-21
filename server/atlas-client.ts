/**
 * Reads for the atlas SSR routes under `/map` (issue #62, stage C4).
 *
 * This file is deliberately not part of `cms-client.ts`. That module is
 * already about 950 lines, and holds only collection reads through the
 * Payload SDK. This file has one custom root endpoint,
 * `GET /api/atlas/seo`, which belongs to no collection, so the SDK cannot
 * express it. It uses a plain `fetch`, the same pattern the related-content
 * readers in `cms-client.ts` use for custom endpoints.
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
import { getCmsContext } from './cms-context'
import { withRetry } from './error-utils'
import type { Locale } from './cms-types'
import type { AtlasSeoResponse, AtlasSitemapResponse } from './atlas-types'
import type { SitemapUrl } from './sitemap'
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
    return await withRetry(async () => {
      const { apiKey, baseURL } = getCmsContext()
      const url =
        `${baseURL}/api/atlas/seo?route=${encodeURIComponent(options.route)}` +
        `&locale=${encodeURIComponent(options.locale)}`

      const response = await fetch(url, {
        headers: { Authorization: `clients API-Key ${apiKey}` },
      })

      console.log(`[PayloadCMS] GET ${url} → ${response.status}`)

      // The route named nothing upstream: a stale inbound link, or a
      // region that has since been unpublished. Returned rather than
      // thrown, so it never costs the retry ladder.
      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        throw new Error(`getAtlasSeo(${options.route}) failed: ${response.status}`)
      }

      return (await response.json()) as AtlasSeoResponse
    })
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
 * Every atlas URL this site is the canonical home of.
 *
 * A sitemap lists the URLs a site claims. Atlas ownership works per
 * subtree: most regions canonicalize to the national site that owns them
 * (#640). Listing those would ask a crawler to index URLs this site itself
 * marks non-canonical.
 *
 * **Ownership is resolved upstream, not here.** `GET /api/atlas/sitemap`
 * answers with the URLs the calling API key's client owns, so the one
 * implementation of the ownership walk stays the one in SahajCloud
 * (#650), and `loc` is the document's own `webUrl` — byte-identical to the
 * `canonical` each page's `<head>` gets from `/api/atlas/seo`.
 *
 * This replaced two paginated collection reads that walked at most 2,000
 * documents each and only then discarded everything off-origin, so growth
 * anywhere in the atlas silently truncated this site's half of the sitemap
 * (#123). One request now, bounded by the answer's own size rather than by
 * a page ceiling that had to guess at the corpus.
 *
 * The origin check that remains is a **guard, not the selection**: it
 * holds the sitemap to URLs on the host actually serving the request, so a
 * key whose client canonicalizes elsewhere cannot publish another site's
 * URLs here.
 *
 * Degrades to `[]` on any failure. A sitemap missing its atlas half still
 * serves the rest of the site.
 *
 * @param origin - The origin serving the request, e.g. `https://wemeditate.com`
 */
export async function getAtlasSitemapUrls(origin: string): Promise<SitemapUrl[]> {
  try {
    return await withRetry(async () => {
      const { apiKey, baseURL } = getCmsContext()
      const url = `${baseURL}/api/atlas/sitemap`

      const response = await fetch(url, {
        headers: { Authorization: `clients API-Key ${apiKey}` },
      })

      console.log(`[PayloadCMS] GET ${url} → ${response.status}`)

      if (!response.ok) {
        throw new Error(`getAtlasSitemapUrls failed: ${response.status}`)
      }

      const body = (await response.json()) as AtlasSitemapResponse
      const rows = Array.isArray(body?.urls) ? body.urls : []
      const prefix = `${origin.replace(/\/$/, '')}/`
      const owned = rows.filter(
        (row) => typeof row?.loc === 'string' && row.loc.startsWith(prefix),
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

      return owned.map((row) => ({ loc: row.loc, lastmod: row.lastmod ?? null }))
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
