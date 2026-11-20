/**
 * Same-origin JSON API routes for client-loaded content.
 *
 * The related-content endpoints (SahajCloud #523) rank by subtle-system-node
 * overlap on the server, and a cold one is slow (about 5 to 12 seconds).
 * Fetching them inside a Vike `data()` hook blocks SSR and trips Vike's
 * slow-hook warning. So instead, the player pages render immediately, and
 * load related content on the client from these routes (see
 * RelatedContentLoader). SahajCloud marks those endpoints edge-cacheable
 * (`publicReadCacheHeaders`), so the slow call is paid once per colo per
 * window. The browser just waits for it asynchronously.
 *
 * `/api/live-preview/populate` and `/api/submissions` are here for an
 * unrelated reason: they are SahajCloud calls the browser is not allowed to make
 * itself, one a draft read and one the public intake write. See their own
 * docblocks.
 *
 * These routes run inside the `contextStorage()` middleware (registered
 * first in entry.ts), so `getSahajCloudContext()` resolves the API key
 * normally.
 */

import * as Sentry from '@sentry/cloudflare'
import type { Context, Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import type { SahajCloudEnv } from './sahajcloud-context'
import {
  documentReadArgs,
  getRelatedMeditations,
  getRelatedLectures,
  getWebConfig,
  isDocumentCollection,
} from './sahajcloud-client'
import { relatedMeditationsToCards, relatedLecturesToCards } from '../lib/related-content'
import { LIVE_PREVIEW_POPULATE_PATH, LIVE_PREVIEW_TOKEN_HEADER } from '../lib/live-preview/protocol'
import {
  CLIENT_IP_HEADER,
  SUBMISSION_PATH,
  TURNSTILE_TOKEN_HEADER,
  type SubmissionResult,
} from '../lib/submissions'
import { readStatus } from './error-utils'
import { verifyLivePreviewToken } from './live-preview'
import { createPayloadClient } from './payload-client'
import { idSchema, SUBMISSION_BODY_LIMIT, submissionSchema } from './validation'
import type { Locale } from './sahajcloud-types'
import { isLocale } from './sahajcloud-types'

/** Accept only a locale SahajCloud defines. Anything else reads as `en`. */
function parseLocale(raw: string | undefined): Locale {
  return raw && isLocale(raw) ? raw : 'en'
}

/** Cache the JSON briefly in the browser and CDN. The heavy work is already
 * edge-cached upstream. stale-while-revalidate keeps repeat views instant. */
const CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=1800'

/**
 * A related section's answer. `null` is a read that failed: it answers an
 * empty section and is never cached, since `CACHE_CONTROL` would hold that
 * empty section for up to half an hour after SahajCloud recovered.
 */
function relatedAnswer(items: unknown[] | null): Response {
  return Response.json(
    { items: items ?? [] },
    { headers: { 'Cache-Control': items ? CACHE_CONTROL : 'no-store' } },
  )
}

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

/**
 * Payload's population round trip, run server-side.
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
function registerLivePreviewPopulate(app: Hono<SahajCloudEnv>): void {
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

/**
 * The status SahajCloud answered with, and the refusal code it named.
 *
 * SahajCloud answers a refusal with `{ errors: [{ message, data: { code } }] }`
 * and `@payloadcms/sdk` rethrows that array on its error. A transport failure
 * carries neither.
 */
function upstreamRefusal(error: unknown): { code?: string; status?: number } {
  const { errors } = (error ?? {}) as { errors?: { data?: { code?: unknown } }[] }
  const raw = errors?.[0]?.data?.code

  return { code: typeof raw === 'string' ? raw : undefined, status: readStatus(error) }
}

/**
 * The 400s this isolate has already reported, as `<proxy>:<code>`.
 *
 * A 400 is the caller's by status, but it is also how a contract drift shows:
 * the intake refusing a key our form sends, or a read shape SahajCloud stopped
 * accepting. One event per distinct code per isolate keeps that visible
 * without billing one per visitor who typed a disposable address — the bound
 * `reportOnce` in report-once.ts states. Past the cap the set is emptied rather
 * than pruned: re-reporting is the harmless direction.
 */
const reportedRefusals = new Set<string>()

const MAX_REPORTED_REFUSALS = 64

/**
 * Reports a failed SahajCloud call from one of the two proxies.
 *
 * A failure that is not the caller's — a 5xx, a timeout, an unreachable
 * SahajCloud, a key it refuses — reports every time. A rate limit, or the
 * intake refusing the visitor with a coded 403 (a failed captcha), is the gate
 * working and is not reported; a 400 reports once per code.
 *
 * ⚠ A refused key is an **uncoded** 403 — Payload's own Forbidden, never a
 * 401 (verified against production) — so only the intake's code makes a 403
 * the caller's. The populate proxy has verified its caller before it calls,
 * so a 403 there is always ours.
 *
 * ⚠ Only the status, the code and the error's name reach the event: the body
 * is the visitor's message, the token is a credential, the address is
 * personal, and SahajCloud's own message may quote any of them.
 */
function reportProxyFailure(proxy: 'submissions' | 'live-preview populate', error: unknown): void {
  const { code, status } = upstreamRefusal(error)

  if (status === 429) return

  if (status === 403 && proxy === 'submissions' && code) return

  if (status === 400) {
    const signature = `${proxy}:${code ?? ''}`

    if (reportedRefusals.has(signature)) return

    if (reportedRefusals.size >= MAX_REPORTED_REFUSALS) reportedRefusals.clear()

    reportedRefusals.add(signature)
  }

  Sentry.captureMessage(`The ${proxy} proxy failed`, {
    level: status === 400 ? 'warning' : 'error',
    tags: { source: proxy },
    extra: {
      status: status ?? null,
      code: code ?? null,
      error: error instanceof Error ? error.name : typeof error,
    },
  })
}

/**
 * A refused submission, as one code and one status the browser may see.
 *
 * The **code** is forwarded and the **message** is not: the message is
 * SahajCloud's own English, written for an integrator reading a log, while the
 * visitor's copy is SahajCloud-owned and rendered from a translation key.
 *
 * A client error (a failed captcha, a disposable address, a key the form never
 * declared) is the caller's and keeps its status. Anything else — a 500, an
 * unreachable SahajCloud, a thrown non-SDK error — is ours, and reads as 502 so a
 * browser never sees our upstream's fault as its own bad request.
 */
function submissionFailure(error: unknown): { code?: string; status: 400 | 403 | 429 | 502 } {
  const { code, status } = upstreamRefusal(error)

  if (status === 403 || status === 429 || status === 400) {
    return { code, status }
  }

  return { status: 502 }
}

/**
 * A refusal the submission route answers itself, without calling SahajCloud.
 *
 * `bodyLimit` answers before the handler runs, so this sets `no-store` too.
 */
function refuseSubmission(
  c: Context<SahajCloudEnv>,
  code: 'captcha_failed' | 'invalid_request',
  status: 400 | 403 | 413 | 415,
) {
  c.header('Cache-Control', 'no-store')

  return c.json<SubmissionResult>({ ok: false, code }, status)
}

/** Whether a request's `Content-Type` names JSON, whatever its parameters. */
function isJson(contentType: string | undefined): boolean {
  return contentType?.split(';')[0].trim().toLowerCase() === 'application/json'
}

/**
 * The public intake, proxied same-origin.
 *
 * The browser cannot post to `POST /api/user-submissions` itself: the create
 * is authenticated with `SAHAJCLOUD_API_KEY`, a server-only secret, and
 * SahajCloud answers a wildcard CORS origin with no credentials
 * (see the live-preview proxy above for the same pairing).
 *
 * ⚠ **Two headers cross over: the captcha token, and the visitor's address.**
 * Forwarding the browser's `Origin` or `Referer` would put this site's own
 * host through the client's `allowedDomains` allowlist, which a
 * server-to-server call is deliberately exempt from — the API key is the gate
 * there. Everything else in the body is re-validated by the collection per
 * type.
 *
 * The address is this Worker's own `cf-connecting-ip`, because SahajCloud
 * would otherwise read our egress address for Turnstile's `remoteip`. It is
 * omitted rather than blanked when we have none: upstream scores without it.
 *
 * Nothing of the created row is echoed back. An API client holds create and
 * no read on `user-submissions` on purpose, and the browser needs only
 * whether it landed.
 *
 * A body is refused unread past `SUBMISSION_BODY_LIMIT`, and unparsed unless
 * it is declared JSON, so neither costs a buffer the schema would refuse.
 */
function registerSubmissions(app: Hono<SahajCloudEnv>): void {
  // Registered before the handler, so it runs first.
  app.use(
    SUBMISSION_PATH,
    bodyLimit({
      maxSize: SUBMISSION_BODY_LIMIT,
      onError: (c) => refuseSubmission(c, 'invalid_request', 413),
    }),
  )

  app.post(SUBMISSION_PATH, async (c) => {
    c.header('Cache-Control', 'no-store')

    if (!isJson(c.req.header('content-type'))) {
      return refuseSubmission(c, 'invalid_request', 415)
    }

    const body = submissionSchema.safeParse(await c.req.json().catch(() => null))

    if (!body.success) return refuseSubmission(c, 'invalid_request', 400)

    const token = c.req.header(TURNSTILE_TOKEN_HEADER)

    // SahajCloud refuses every public write without a token, so this is its
    // answer, given without spending the round trip.
    if (!token) return refuseSubmission(c, 'captcha_failed', 403)

    const clientIp = c.req.header('cf-connecting-ip')

    try {
      const client = createPayloadClient()

      await client.request({
        method: 'POST',
        path: '/user-submissions',
        // Nothing reads the response, so ask SahajCloud to populate nothing.
        args: { depth: 0 },
        json: body.data,
        init: {
          headers: {
            [TURNSTILE_TOKEN_HEADER]: token,
            ...(clientIp ? { [CLIENT_IP_HEADER]: clientIp } : {}),
          },
        },
      })

      return c.json<SubmissionResult>({ ok: true })
    } catch (error) {
      reportProxyFailure('submissions', error)

      const failure = submissionFailure(error)

      return c.json<SubmissionResult>(
        { ok: false, ...(failure.code ? { code: failure.code } : {}) },
        failure.status,
      )
    }
  })
}

export function registerApiRoutes(app: Hono<SahajCloudEnv>): void {
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

      return relatedAnswer(cards && relatedMeditationsToCards(cards))
    } catch {
      return relatedAnswer(null)
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

      return relatedAnswer(cards && relatedLecturesToCards(cards))
    } catch {
      return relatedAnswer(null)
    }
  })
}
