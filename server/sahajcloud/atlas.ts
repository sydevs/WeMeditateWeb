/**
 * Reads for the atlas SSR routes under `/map` (issue #62, stage C4).
 *
 * This file is deliberately not one of the content reads beside it. That module is
 * already about 950 lines, and holds only collection reads through the
 * Payload SDK. This file has two custom root endpoints,
 * `GET /api/atlas/seo` and `GET /api/atlas/sitemap`, which belong to no
 * collection, so the SDK cannot express them. Both go through
 * `server/sahajcloud/fetch.ts`, the one helper every custom-endpoint read
 * shares.
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

import { sahajCloudFetch, sahajCloudFetchOptional } from './fetch'
import { degrade, warnOnce, withRetry } from '@/server/error-utils'
import type { Locale } from '@/types/sahajcloud'
import type { AtlasSeoResponse, AtlasSitemapResponse } from '@/types/atlas'
import type { SitemapUrl } from '@/server/routes/sitemap.xml/sitemap'
import { parseAtlasRoute } from '@/lib/atlas/route'
import { encodeUrl } from '@/lib/urls/urls'

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
 * @param options.route - The atlas route as `matchMapRoute` spelled it: decoded,
 *   NFC, never percent-encoded, e.g. `/nl/amsterdam` or `/gb/london/1204`
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
  // under a region asks for the spelling `matchMapRoute` handed over, which
  // is decoded already, so the encode below is the only one.
  const upstreamRoute = target.kind === 'root' ? '/' : options.route

  const read = async () => {
    // A 404 means the route named nothing upstream: a stale inbound link, or
    // a region that has since been unpublished. `sahajCloudFetchOptional` answers it
    // with `null`, which reads the same as the no-target case above.
    const answer = await withRetry(
      () =>
        sahajCloudFetchOptional<AtlasSeoResponse>(
          `/api/atlas/seo?route=${encodeURIComponent(upstreamRoute)}` +
            `&locale=${encodeURIComponent(options.locale)}`,
          `getAtlasSeo(${upstreamRoute})`,
        ),
      { reportFailure: false },
    )

    // The root answer is built from a global rather than a document, so it has
    // nothing to go missing: a 404 here means the atlas root is misconfigured
    // upstream, not that an inbound link went stale. Left silent it restores
    // the undescribed `/map` of #64 with nothing to say why.
    if (!answer && target.kind === 'root') {
      console.warn(`[getAtlasSeo] no document for the atlas root (asked for ${options.route})`)
      warnOnce(options.locale, 'getAtlasSeo got no document for the atlas root', {
        source: 'getAtlasSeo',
        extra: { askedFor: options.route, locale: options.locale },
      })
    }

    return answer
  }

  // Crawlers and no-JS visitors rely on the server-rendered half. The widget
  // still works without it. Losing it must not take the page down.
  return degrade(read, {
    source: 'getAtlasSeo',
    message: 'getAtlasSeo failed; rendering the atlas without server content',
    // No key: a crawl walks up to SITEMAP_URL_CAP routes, so a site-wide 403
    // or 5xx is one event per kind, and the route rides in `extra`.
    subject: upstreamRoute,
    fallback: null,
    // Both: the request carries the normalized route, so an event naming
    // only the asked-for one cannot be matched to the failing URL.
    extra: {
      route: upstreamRoute,
      askedFor: options.route,
      locale: options.locale,
      target: target.kind,
    },
  })
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
export const SITEMAP_URL_CAP = 45_000

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
  const read = async () => {
    const body = await sahajCloudFetch<AtlasSitemapResponse>(
      '/api/atlas/sitemap',
      'getAtlasSitemapUrls',
    )

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
      console.warn(`[getAtlasSitemapUrls] every URL is off-origin for ${origin}`)
      warnOnce(origin, 'getAtlasSitemapUrls dropped every URL as off-origin', {
        source: 'getAtlasSitemapUrls',
        extra: { origin, returned: rows.length, sample: rows[0]?.loc ?? null },
      })
    }

    if (owned.length > SITEMAP_URL_CAP) {
      console.warn(`[getAtlasSitemapUrls] ${owned.length} URLs truncated to ${SITEMAP_URL_CAP}`)
      warnOnce(origin, 'getAtlasSitemapUrls hit the sitemap cap; atlas URLs are truncated', {
        source: 'getAtlasSitemapUrls',
        extra: { origin, owned: owned.length, cap: SITEMAP_URL_CAP },
      })
    }

    // Upstream composes `webUrl` as `base + encodeURI(webPath)`, so these
    // arrive encoded. `encodeUrl` is the one spelling a `<loc>` of ours may
    // carry, and it leaves an already-encoded URL alone — so a hand-mirrored
    // field that ever arrives raw cannot reach the sitemap that way.
    return owned
      .slice(0, SITEMAP_URL_CAP)
      .map((row) => ({ loc: encodeUrl(row.loc), lastmod: row.lastmod ?? null }))
  }

  return degrade(() => withRetry(read, { reportFailure: false }), {
    source: 'getAtlasSitemapUrls',
    message: 'getAtlasSitemapUrls failed; sitemap omits atlas URLs',
    key: origin,
    fallback: [],
    extra: { origin },
  })
}
