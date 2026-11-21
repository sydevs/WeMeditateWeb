/**
 * How the two SahajCloud proxies — `submissions/route.ts` and
 * `live-preview/populate/route.ts` — read and report a failed call.
 */

import * as Sentry from '@sentry/cloudflare'
import { readStatus } from '@/lib/errors/error-type'
import { warnOnce } from '@/server/error-utils'

/**
 * The status SahajCloud answered with, and the refusal code it named.
 *
 * SahajCloud answers a refusal with `{ errors: [{ message, data: { code } }] }`
 * and `@payloadcms/sdk` rethrows that array on its error. A transport failure
 * carries neither.
 */
export function upstreamRefusal(error: unknown): { code?: string; status?: number } {
  const { errors } = (error ?? {}) as { errors?: { data?: { code?: unknown } }[] }
  const raw = errors?.[0]?.data?.code

  return { code: typeof raw === 'string' ? raw : undefined, status: readStatus(error) }
}

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
export function reportProxyFailure(
  proxy: 'submissions' | 'live-preview populate',
  error: unknown,
): void {
  const { code, status } = upstreamRefusal(error)

  if (status === 429) return

  if (status === 403 && proxy === 'submissions' && code) return

  const message = `The ${proxy} proxy failed`
  const extra = {
    status: status ?? null,
    code: code ?? null,
    error: error instanceof Error ? error.name : typeof error,
  }

  // A 400 is the caller's by status, but it is also how a contract drift shows:
  // the intake refusing a key our form sends, or a read shape SahajCloud
  // stopped accepting. Once per code keeps that visible without billing one
  // event per visitor who typed a disposable address.
  if (status === 400) {
    warnOnce(code ?? '', message, { source: proxy, extra })

    return
  }

  Sentry.captureMessage(message, { level: 'error', tags: { source: proxy }, extra })
}
