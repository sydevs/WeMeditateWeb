/**
 * `POST /api/live-preview/populate` — Payload's population round trip, run
 * server-side.
 *
 * ## Why it exists
 *
 * A live-preview message carries the admin form's unsaved document, in which
 * every relationship is a bare id. `mergeData` sends that document back to the
 * SahajCloud to have the relationships populated, and the answer is what the page
 * renders. Two things stop the browser doing it directly:
 *
 * - **the credential.** `SAHAJCLOUD_API_KEY` is a server-only secret, and the
 *   SahajCloud answers an unauthenticated read with a 403 (verified against
 *   production).
 * - **CORS.** The SDK's default handler POSTs with `credentials: 'include'`
 *   while SahajCloud answers `Access-Control-Allow-Origin: *` with no
 *   `Allow-Credentials`, a pairing browsers refuse. The wildcard is
 *   load-bearing for the atlas widget on third-party hosts, so it is the
 *   request that moves, not the CORS header.
 *
 * Same-origin, both problems are gone: no preflight, and the key never leaves
 * the server.
 *
 * ## The gate
 *
 * ⚠ **The token is re-verified here, and nothing else guards this route.**
 * The API key is attached on OUR side, so a caller who reaches the forward has
 * SahajCloud's unpublished content. A refusal is a bare 403 with no body: a
 * caller learns that it was refused, never why, and never whether the document
 * they named exists.
 *
 * ## The read shape
 *
 * `documentReadArgs` repeats what the server render asked for. SahajCloud
 * requires `select` from an API client and `populate` at depth > 1, and prunes
 * its answer to `select` — all three verified against production. The shape
 * goes in the BODY, not the query string: under the method override the body
 * wins, so a `depth` in the query would be silently overridden by Payload's.
 */

import type { Hono } from 'hono'
import type { SahajCloudEnv } from '@/server/sahajcloud/context'
import { documentReadArgs, isDocumentCollection } from '@/server/sahajcloud/client'
import { verifyLivePreviewToken } from '@/server/live-preview'
import { createPayloadClient } from '@/server/sahajcloud/payload-client'
import { idSchema } from '@/server/validation'
import { LIVE_PREVIEW_POPULATE_PATH, LIVE_PREVIEW_TOKEN_HEADER } from '@/lib/live-preview/protocol'
import { reportProxyFailure } from '@/server/routes/api/_proxy-failure'
import { parseLocale } from '@/lib/i18n/locales'

/** Turns Payload's POST body into the GET SahajCloud actually answers. */
const HTTP_METHOD_OVERRIDE_HEADER = 'X-Payload-HTTP-Method-Override'

/**
 * One document the populate proxy will read, or `null` for anything else.
 *
 * `mergeData` spells its endpoint `<collectionSlug>/<id>`, or
 * `globals/<slug>`. Only the collections `getDocumentById` already reads are
 * accepted, which is a closed list rather than a shape test: it rules out a
 * traversal, an unrelated collection, and every global at once.
 *
 * Globals are refused on purpose and nothing is lost by it. SahajCloud emits
 * `scope=` for a global preview, `useDocumentPreviewActive()` is false under a
 * scope, and so no subscriber for a global is ever mounted (see
 * `lib/live-preview/document.tsx`).
 */
function parsePopulateEndpoint(raw: string | undefined) {
  const [collection, id, ...rest] = (raw ?? '').split('/')

  if (!collection || !id || rest.length > 0) return null

  if (!isDocumentCollection(collection)) return null

  try {
    return { collection, id: idSchema.parse(id) }
  } catch {
    return null
  }
}

export function registerLivePreviewPopulate(app: Hono<SahajCloudEnv>): void {
  app.post(LIVE_PREVIEW_POPULATE_PATH, async (c) => {
    const token = c.req.header(LIVE_PREVIEW_TOKEN_HEADER)

    if (
      !token ||
      !(await verifyLivePreviewToken(token, import.meta.env.PUBLIC__LIVE_PREVIEW_VERIFY_KEY))
    ) {
      return c.body(null, 403)
    }

    const target = parsePopulateEndpoint(c.req.query('endpoint'))

    if (!target) return c.body(null, 400)

    const body = await c.req.json().catch(() => null)
    const document = (body as { data?: unknown } | null)?.data

    if (!document || typeof document !== 'object' || Array.isArray(document)) {
      return c.body(null, 400)
    }

    const locale = (body as { locale?: string }).locale

    try {
      const client = createPayloadClient({ preview: true, previewToken: token })

      const response = await client.request({
        method: 'POST',
        path: `/${target.collection}/${target.id}`,
        json: {
          data: document,
          // The incoming document has already had its locales flattened.
          flattenLocales: false,
          locale: parseLocale(locale),
          ...documentReadArgs(target.collection),
        },
        init: { headers: { [HTTP_METHOD_OVERRIDE_HEADER]: 'GET' } },
      })

      return new Response(await response.text(), {
        headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' },
      })
    } catch (error) {
      reportProxyFailure('live-preview populate', error)

      // A draft read that fails is not a broken page. The browser keeps the
      // last good document on screen (see `lib/live-preview/document.tsx`).
      return c.body(null, 502)
    }
  })
}
