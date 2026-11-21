/**
 * `POST /api/submissions` — the public intake, proxied same-origin.
 *
 * The browser cannot post to `POST /api/user-submissions` itself: the create
 * is authenticated with `SAHAJCLOUD_API_KEY`, a server-only secret, and
 * SahajCloud answers a wildcard CORS origin with no credentials
 * (`live-preview/populate/` meets the same pairing).
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

import type { Context, Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import type { SahajCloudEnv } from '@/server/sahajcloud/context'
import { createPayloadClient } from '@/server/sahajcloud/payload-client'
import { SUBMISSION_BODY_LIMIT, submissionSchema } from './schema'
import {
  CLIENT_IP_HEADER,
  SUBMISSION_PATH,
  TURNSTILE_TOKEN_HEADER,
  type SubmissionResult,
} from '@/lib/forms/submissions'
import { reportProxyFailure, upstreamRefusal } from '@/server/routes/api/_proxy-failure'

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

export function registerSubmissions(app: Hono<SahajCloudEnv>): void {
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
