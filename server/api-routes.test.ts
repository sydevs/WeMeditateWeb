import { Hono } from 'hono'
import { SignJWT } from 'jose'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { LIVE_PREVIEW_POPULATE_PATH, LIVE_PREVIEW_TOKEN_HEADER } from '../lib/live-preview/protocol'
import type { CmsEnv } from './cms-context'

/**
 * ⚠ The gate on `/api/live-preview/populate`, which is new attack surface.
 *
 * The route attaches `SAHAJCLOUD_API_KEY` on our side, so without a signature
 * check it is an open proxy handing any caller the CMS's unpublished content.
 * Every case below asserts the same two things together: the status is a bare
 * **403**, and the CMS was **not called at all** — a gate that refuses after
 * fetching has still leaked the read.
 */

const { createdWith, request } = vi.hoisted(() => ({
  createdWith: [] as unknown[],
  request: vi.fn(),
}))

vi.mock('./cms-context', () => ({
  getCmsContext: () => ({ apiKey: 'test-key', baseURL: 'https://cms.test', kv: undefined }),
}))
vi.mock('@sentry/react', () => ({ captureMessage: vi.fn(), captureException: vi.fn() }))
vi.mock('./payload-client', () => ({
  createPayloadClient: (config: unknown) => {
    createdWith.push(config)

    return { request }
  },
}))

const { registerApiRoutes } = await import('./api-routes')

const NOW = () => Math.floor(Date.now() / 1000)

let verifyKeyBase64: string
let sign: (exp: number) => Promise<string>
let signWithOtherKey: (exp: number) => Promise<string>

/** Mints with the construction SahajCloud uses: an EdDSA JWS carrying `exp`. */
async function minter() {
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

beforeAll(async () => {
  const real = await minter()
  const other = await minter()

  verifyKeyBase64 = real.publicKey
  sign = real.sign
  signWithOtherKey = other.sign
})

beforeEach(() => {
  createdWith.length = 0
  request.mockReset()
  request.mockResolvedValue(new Response(JSON.stringify({ id: 98, title: 'Edited' })))
  vi.stubEnv('PUBLIC__LIVE_PREVIEW_VERIFY_KEY', verifyKeyBase64)
})

function populate(options: { token?: string; endpoint?: string; body?: unknown } = {}) {
  const app = new Hono<CmsEnv>()

  registerApiRoutes(app)

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

describe('POST /api/live-preview/populate — the token gate', () => {
  it('refuses a request with no token, without calling the CMS', async () => {
    const response = await populate()

    expect(response.status).toBe(403)
    expect(request).not.toHaveBeenCalled()
  })

  it('refuses a token signed by another key, without calling the CMS', async () => {
    const response = await populate({ token: await signWithOtherKey(NOW() + 600) })

    expect(response.status).toBe(403)
    expect(request).not.toHaveBeenCalled()
  })

  it('refuses an expired token, without calling the CMS', async () => {
    const response = await populate({ token: await sign(NOW() - 10) })

    expect(response.status).toBe(403)
    expect(request).not.toHaveBeenCalled()
  })

  it('refuses everything when no verify key is configured', async () => {
    vi.stubEnv('PUBLIC__LIVE_PREVIEW_VERIFY_KEY', '')

    const response = await populate({ token: await sign(NOW() + 600) })

    expect(response.status).toBe(403)
    expect(request).not.toHaveBeenCalled()
  })

  it('echoes nothing back on a refusal', async () => {
    // Not even the endpoint that was asked for: a caller probing this route
    // learns only that it refused, never whether the document exists.
    const response = await populate({ token: 'not.a.token', endpoint: 'pages/98' })

    expect(response.status).toBe(403)
    expect(await response.text()).toBe('')
  })
})

describe('POST /api/live-preview/populate — the endpoint', () => {
  it('refuses a collection it does not read, without calling the CMS', async () => {
    const response = await populate({ endpoint: 'users/1', token: await sign(NOW() + 600) })

    expect(response.status).toBe(400)
    expect(request).not.toHaveBeenCalled()
  })

  it('refuses a global, a traversal and a missing id alike', async () => {
    const token = await sign(NOW() + 600)

    for (const endpoint of ['globals/wm-web-config', 'pages/../users/1', 'pages', 'pages/abc']) {
      expect((await populate({ endpoint, token })).status).toBe(400)
    }

    expect(request).not.toHaveBeenCalled()
  })
})

describe('POST /api/live-preview/populate — the forward', () => {
  it('sends the unsaved document to the CMS with the verified token', async () => {
    const token = await sign(NOW() + 600)

    const response = await populate({ token })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ id: 98, title: 'Edited' })

    // The key is ours; the token is the caller's, re-verified above.
    expect(createdWith).toEqual([{ preview: true, previewToken: token }])

    const sent = request.mock.calls[0][0]

    expect(sent.method).toBe('POST')
    expect(sent.path).toBe('/pages/98')
    expect(sent.init.headers['X-Payload-HTTP-Method-Override']).toBe('GET')
    expect(sent.json.data).toEqual({ id: 98, title: 'Edited' })
    expect(sent.json.locale).toBe('en')
  })

  it('repeats the read shape the server render used', async () => {
    // SahajCloud 400s an API-client read with no `select`, and a depth > 1 read
    // with no `populate` — and it prunes the answer to `select`, so a shape
    // that disagreed with the render would drop fields the template renders.
    await populate({ token: await sign(NOW() + 600) })

    const sent = request.mock.calls[0][0]

    expect(sent.json.depth).toBe(3)
    expect(sent.json.select).toMatchObject({ title: true, content: true })
    expect(sent.json.populate).toMatchObject({ images: expect.any(Object) })
    expect(sent.json.flattenLocales).toBe(false)
  })

  it('degrades rather than 500s when the CMS read fails', async () => {
    // The browser keeps the last good document on screen, so a failure here is
    // a status the handler can read, never an exception that reaches Vike.
    request.mockRejectedValue(new Error('CMS down'))

    const response = await populate({ token: await sign(NOW() + 600) })

    expect(response.status).toBe(502)
    expect(await response.text()).toBe('')
  })

  it('reads an unknown locale as English rather than passing it on', async () => {
    await populate({ body: { data: { id: 98 }, locale: 'xx' }, token: await sign(NOW() + 600) })

    expect(request.mock.calls[0][0].json.locale).toBe('en')
  })

  it('refuses a body with no document', async () => {
    const response = await populate({ body: { locale: 'en' }, token: await sign(NOW() + 600) })

    expect(response.status).toBe(400)
    expect(request).not.toHaveBeenCalled()
  })
})
