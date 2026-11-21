/** The answer the two `related-*` routes share. */

import { JSON_CACHE_CONTROL } from '@/server/cache-headers'

/**
 * A related section's answer. `null` is a read that failed: it answers an
 * empty section and is never cached, since `JSON_CACHE_CONTROL` would hold
 * that empty section for up to half an hour after SahajCloud recovered.
 */
export function relatedAnswer(items: unknown[] | null): Response {
  return Response.json(
    { items: items ?? [] },
    { headers: { 'Cache-Control': items ? JSON_CACHE_CONTROL : 'no-store' } },
  )
}
