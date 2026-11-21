/** The answer the two `related-*` routes share. */

/** Cache the JSON briefly in the browser and CDN. The heavy work is already
 * edge-cached upstream. stale-while-revalidate keeps repeat views instant. */
const CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=1800'

/**
 * A related section's answer. `null` is a read that failed: it answers an
 * empty section and is never cached, since `CACHE_CONTROL` would hold that
 * empty section for up to half an hour after SahajCloud recovered.
 */
export function relatedAnswer(items: unknown[] | null): Response {
  return Response.json(
    { items: items ?? [] },
    { headers: { 'Cache-Control': items ? CACHE_CONTROL : 'no-store' } },
  )
}
