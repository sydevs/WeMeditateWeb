/**
 * How the two SahajCloud proxies — `submissions.ts` and
 * `live-preview/populate.ts` — read and report a failed call.
 */

import * as Sentry from '@sentry/cloudflare'
import { readStatus } from '../../error-utils'

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
 * The 400s this isolate has already reported, as `<proxy>:<code>`.
 *
 * A 400 is the caller's by status, but it is also how a contract drift shows:
 * the intake refusing a key our form sends, or a read shape SahajCloud stopped
 * accepting. One event per distinct code per isolate keeps that visible
 * without billing one per visitor who typed a disposable address — the bound
 * `reportedConfigGaps` in sahajcloud-client.ts states. Past the cap the set is
 * emptied rather than pruned: re-reporting is the harmless direction.
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
export function reportProxyFailure(
  proxy: 'submissions' | 'live-preview populate',
  error: unknown,
): void {
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
