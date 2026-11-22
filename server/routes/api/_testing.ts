/**
 * Requests and fixtures the `/api/*` route tests share. Each test file still
 * declares its own `vi.mock`s: a mock is hoisted only within the file that
 * calls it.
 */

import type { Hono } from 'hono'
import { SignJWT } from 'jose'
import type { Mock } from 'vitest'

import { LIVE_PREVIEW_POPULATE_PATH, LIVE_PREVIEW_TOKEN_HEADER } from '@/lib/live-preview/protocol'
import { SUBMISSION_PATH, TURNSTILE_TOKEN_HEADER } from '@/lib/forms/submissions'
import type { SahajCloudEnv } from '@/server/sahajcloud/context'

type App = Hono<SahajCloudEnv>

export const NOW = () => Math.floor(Date.now() / 1000)

/** Mints with the construction SahajCloud uses: an EdDSA JWS carrying `exp`. */
export async function previewTokenMinter() {
  const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair

  return {
    publicKey: Buffer.from(await crypto.subtle.exportKey('raw', pair.publicKey)).toString('base64'),
    sign: (exp: number) =>
      new SignJWT({})
        .setProtectedHeader({ alg: 'EdDSA' })
        .setExpirationTime(exp)
        .sign(pair.privateKey),
  }
}

export function populateRequest(
  app: App,
  options: { token?: string; endpoint?: string; body?: unknown } = {},
) {
  const endpoint = encodeURIComponent(options.endpoint ?? 'pages/98')

  return app.request(`https://wemeditate.com${LIVE_PREVIEW_POPULATE_PATH}?endpoint=${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { [LIVE_PREVIEW_TOKEN_HEADER]: options.token } : {}),
    },
    body: JSON.stringify(options.body ?? { data: { id: 98, title: 'Edited' }, locale: 'en' }),
  })
}

export function submitRequest(
  app: App,
  options: { body?: unknown; token?: string; clientIp?: string; contentType?: string } = {},
) {
  return app.request(`https://wemeditate.com${SUBMISSION_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': options.contentType ?? 'application/json',
      Origin: 'https://wemeditate.com',
      Referer: 'https://wemeditate.com/contact',
      ...(options.token ? { [TURNSTILE_TOKEN_HEADER]: options.token } : {}),
      // Spelled as Cloudflare sends it, not as the route reads it.
      ...(options.clientIp ? { 'CF-Connecting-IP': options.clientIp } : {}),
    },
    body: JSON.stringify(
      options.body ?? {
        form: 12,
        type: 'contact',
        senderEmail: 'ada@example.org',
        submissionData: [{ field: 'message', value: 'Hello' }],
      },
    ),
  })
}

/** The refusal shape `@payloadcms/sdk` rethrows, as SahajCloud composes it. */
export function sdkError(status: number, code?: string) {
  return Object.assign(new Error('refused'), {
    status,
    errors: [
      { message: 'The captcha could not be verified.', ...(code ? { data: { code } } : {}) },
    ],
  })
}

/** Answers every `fetch` through `fetchMock` with this status and JSON body. */
export function stubUpstream(fetchMock: Mock, status: number, body: unknown = {}) {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    json: async () => body,
  }

  // sahajCloudFetch clones a non-OK response to dump the SahajCloud error body.
  fetchMock.mockResolvedValue({ ...response, clone: () => response })
}
