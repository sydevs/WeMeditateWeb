/**
 * Same-origin JSON API routes for client-loaded content.
 *
 * The related-content endpoints (SahajCloud #523) rank by subtle-system-node
 * overlap on the server, and are slow (about 5 to 12 seconds, not cached
 * upstream). Fetching them inside a Vike `data()` hook blocks SSR and trips
 * Vike's slow-hook warning. So instead, the player pages render
 * immediately, and load related content on the client from these routes
 * (see RelatedContentLoader). The routes wrap the same KV-cached fetchers,
 * so the slow upstream call happens at most once per cache window. The
 * browser just waits for it asynchronously.
 *
 * `/api/live-preview/populate` and `/api/submissions` are here for an
 * unrelated reason: they are the CMS calls the browser is not allowed to make
 * itself, one a draft read and one the public intake write. See their own
 * docblocks.
 *
 * These routes run inside the `contextStorage()` middleware (registered
 * first in entry.ts), so `getCmsContext()` resolves the API key and KV
 * binding normally.
 */

import type { Hono } from 'hono'
import type { CmsEnv } from './cms-context'
import {
  documentReadArgs,
  getRelatedMeditations,
  getRelatedLectures,
  getWebConfig,
  isDocumentCollection,
} from './cms-client'
import { relatedMeditationsToCards, relatedLecturesToCards } from '../lib/related-content'
import { LIVE_PREVIEW_POPULATE_PATH, LIVE_PREVIEW_TOKEN_HEADER } from '../lib/live-preview/protocol'
import { SUBMISSION_PATH, TURNSTILE_TOKEN_HEADER, type SubmissionResult } from '../lib/cms-forms'
import { verifyLivePreviewToken } from './live-preview'
import { createPayloadClient } from './payload-client'
import { idSchema, submissionSchema } from './validation'
import type { Locale } from './cms-types'
import { isLocale } from './cms-types'

/** Accept only a locale the CMS defines. Anything else reads as `en`. */
function parseLocale(raw: string | undefined): Locale {
  return raw && isLocale(raw) ? raw : 'en'
}

/** Cache the JSON briefly in the browser and CDN. The heavy work is
 * already KV-cached on the server. stale-while-revalidate keeps repeat
 * views instant. */
const CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=1800'

/** Turns Payload's POST body into the GET the CMS actually answers. */
const HTTP_METHOD_OVERRIDE_HEADER = 'X-Payload-HTTP-Method-Override'

/**
 * One document the populate proxy will read, or `null` for anything else.
 *
 * `mergeData` spells its endpoint `<collectionSlug>/<id>`, or
 * `globals/<slug>`. Only the collections `getDocumentById` already reads are
 * accepted, which is a closed list rather than a shape test: it rules out a
 * traversal, an unrelated collection, and every global at once.
 *
 * Globals are refused on purpose and nothing is lost by it. The CMS emits
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

/**
 * Payload's population round trip, run server-side.
 *
 * ## Why it exists
 *
 * A live-preview message carries the admin form's unsaved document, in which
 * every relationship is a bare id. `mergeData` sends that document back to the
 * CMS to have the relationships populated, and the answer is what the page
 * renders. Two things stop the browser doing it directly:
 *
 * - **the credential.** `SAHAJCLOUD_API_KEY` is a server-only secret, and the
 *   CMS answers an unauthenticated read with a 403 (verified against
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
 * the CMS's unpublished content. A refusal is a bare 403 with no body: a
 * caller learns that it was refused, never why, and never whether the document
 * they named exists.
 *
 * ## The read shape
 *
 * `documentReadArgs` repeats what the server render asked for. The CMS
 * requires `select` from an API client and `populate` at depth > 1, and prunes
 * its answer to `select` — all three verified against production. The shape
 * goes in the BODY, not the query string: under the method override the body
 * wins, so a `depth` in the query would be silently overridden by Payload's.
 */
function registerLivePreviewPopulate(app: Hono<CmsEnv>): void {
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
    } catch {
      // A draft read that fails is not a broken page. The browser keeps the
      // last good document on screen (see `lib/live-preview/document.tsx`).
      return c.body(null, 502)
    }
  })
}

/**
 * A refused submission, as one code and one status the browser may see.
 *
 * The CMS answers a refusal with `{ errors: [{ message, data: { code } }] }`
 * and `@payloadcms/sdk` rethrows that array on its error. The **code** is
 * forwarded and the **message** is not: the message is the CMS's own English,
 * written for an integrator reading a log, while the visitor's copy is
 * CMS-owned and rendered from a translation key.
 *
 * A client error (a failed captcha, a disposable address, a key the form never
 * declared) is the caller's and keeps its status. Anything else — a 500, an
 * unreachable CMS, a thrown non-SDK error — is ours, and reads as 502 so a
 * browser never sees our upstream's fault as its own bad request.
 */
function submissionFailure(error: unknown): { code?: string; status: 400 | 403 | 429 | 502 } {
  const { errors, status } = (error ?? {}) as {
    errors?: { data?: { code?: unknown } }[]
    status?: unknown
  }
  const raw = errors?.[0]?.data?.code
  const code = typeof raw === 'string' ? raw : undefined

  if (status === 403 || status === 429 || status === 400) {
    return { code, status }
  }

  return { status: 502 }
}

/**
 * The public intake, proxied same-origin.
 *
 * The browser cannot post to `POST /api/user-submissions` itself: the create
 * is authenticated with `SAHAJCLOUD_API_KEY`, a server-only secret, and
 * SahajCloud answers a wildcard CORS origin with no credentials
 * (see the live-preview proxy above for the same pairing).
 *
 * ⚠ **Exactly one header crosses over: the captcha token.** Forwarding the
 * browser's `Origin` or `Referer` would put this site's own host through the
 * client's `allowedDomains` allowlist, which a server-to-server call is
 * deliberately exempt from — the API key is the gate there. Everything else
 * in the body is re-validated by the collection per type.
 *
 * Nothing of the created row is echoed back. An API client holds create and
 * no read on `user-submissions` on purpose, and the browser needs only
 * whether it landed.
 */
function registerSubmissions(app: Hono<CmsEnv>): void {
  app.post(SUBMISSION_PATH, async (c) => {
    c.header('Cache-Control', 'no-store')

    const body = submissionSchema.safeParse(await c.req.json().catch(() => null))

    if (!body.success) {
      return c.json<SubmissionResult>({ ok: false, code: 'invalid_request' }, 400)
    }
    const token = c.req.header(TURNSTILE_TOKEN_HEADER)

    try {
      const client = createPayloadClient()

      await client.request({
        method: 'POST',
        path: '/user-submissions',
        // Nothing reads the response, so ask the CMS to populate nothing.
        args: { depth: 0 },
        json: body.data,
        init: { headers: token ? { [TURNSTILE_TOKEN_HEADER]: token } : {} },
      })

      return c.json<SubmissionResult>({ ok: true })
    } catch (error) {
      const failure = submissionFailure(error)

      return c.json<SubmissionResult>(
        { ok: false, ...(failure.code ? { code: failure.code } : {}) },
        failure.status,
      )
    }
  })
}

export function registerApiRoutes(app: Hono<CmsEnv>): void {
  registerLivePreviewPopulate(app)
  registerSubmissions(app)
  // Meditations related to a lecture (not audience-gated).
  app.get('/api/related-meditations/:lectureId', async (c) => {
    let id: string

    try {
      id = idSchema.parse(c.req.param('lectureId'))
    } catch {
      return c.json({ items: [] }, 400)
    }

    // Related content never 500s. Degrade to an empty section on any failure.
    try {
      const cards = await getRelatedMeditations({ id, locale: parseLocale(c.req.query('locale')) })

      c.header('Cache-Control', CACHE_CONTROL)

      return c.json({ items: relatedMeditationsToCards(cards) })
    } catch {
      return c.json({ items: [] })
    }
  })

  // Lectures related to a meditation. Audience-gated: audiences come from
  // the site config. getRelatedLectures returns [] when none are set.
  app.get('/api/related-lectures/:meditationId', async (c) => {
    let id: string

    try {
      id = idSchema.parse(c.req.param('meditationId'))
    } catch {
      return c.json({ items: [] }, 400)
    }
    const locale = parseLocale(c.req.query('locale'))

    // getWebConfig can rethrow after retries are exhausted (the fetchers
    // themselves degrade internally). Related content never 500s. Fall
    // back to empty.
    try {
      const settings = await getWebConfig({ locale })
      const cards = await getRelatedLectures({ id, locale, audiences: settings.audiences })

      c.header('Cache-Control', CACHE_CONTROL)

      return c.json({ items: relatedLecturesToCards(cards) })
    } catch {
      return c.json({ items: [] })
    }
  })
}
