import * as Sentry from '@sentry/cloudflare'
import { Hono } from 'hono'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SahajCloudEnv } from '../../sahajcloud-context'
import { NOW, populateRequest, previewTokenMinter, sdkError, submitRequest } from './_testing'

/** What reaches Sentry from both proxies, driven through their routes. */

const { request } = vi.hoisted(() => ({ request: vi.fn() }))

vi.mock('../../sahajcloud-context', () => ({
  getSahajCloudContext: () => ({
    apiKey: 'test-key',
    baseURL: 'https://sahajcloud.test',
  }),
}))
vi.mock('@sentry/cloudflare', () => ({ captureMessage: vi.fn(), captureException: vi.fn() }))
vi.mock('../../payload-client', () => ({ createPayloadClient: () => ({ request }) }))

const { registerLivePreviewPopulate } = await import('./live-preview/populate/route')
const { registerSubmissions } = await import('./submissions/route')

let verifyKeyBase64: string
let sign: (exp: number) => Promise<string>

beforeAll(async () => {
  const minter = await previewTokenMinter()

  verifyKeyBase64 = minter.publicKey
  sign = minter.sign
})

beforeEach(() => {
  request.mockReset()
  vi.mocked(Sentry.captureMessage).mockClear()
  vi.stubEnv('PUBLIC__LIVE_PREVIEW_VERIFY_KEY', verifyKeyBase64)
})

function app() {
  const routes = new Hono<SahajCloudEnv>()

  registerLivePreviewPopulate(routes)
  registerSubmissions(routes)

  return routes
}

const populate = (options?: Parameters<typeof populateRequest>[1]) =>
  populateRequest(app(), options)
const submit = (options?: Parameters<typeof submitRequest>[1]) => submitRequest(app(), options)

/** Every argument of every Sentry call so far, as one string to search. */
const reported = () => JSON.stringify(vi.mocked(Sentry.captureMessage).mock.calls)

describe('Both proxies — what reaches Sentry', () => {
  it('reports a failed draft read, without the token', async () => {
    const token = await sign(NOW() + 600)

    request.mockRejectedValue(new Error('SahajCloud down'))
    await populate({ token })

    expect(Sentry.captureMessage).toHaveBeenCalledWith('The live-preview populate proxy failed', {
      level: 'error',
      tags: { source: 'live-preview populate' },
      extra: { status: null, code: null, error: 'Error' },
    })
    expect(reported()).not.toContain(token)
  })

  it('reports a SahajCloud fault every time, with no body, token or address', async () => {
    request.mockRejectedValue(sdkError(500, 'internal'))

    await submit({ token: 'turnstile-token', clientIp: '203.0.113.7' })
    await submit({ token: 'turnstile-token', clientIp: '203.0.113.7' })

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(2)
    expect(Sentry.captureMessage).toHaveBeenCalledWith('The submissions proxy failed', {
      level: 'error',
      tags: { source: 'submissions' },
      extra: { status: 500, code: 'internal', error: 'Error' },
    })

    for (const secret of ['ada@example.org', 'Hello', 'turnstile-token', '203.0.113.7']) {
      expect(reported()).not.toContain(secret)
    }
  })

  it('reports an unreachable SahajCloud', async () => {
    request.mockRejectedValue(new TypeError('fetch failed'))

    await submit({ token: 'turnstile-token' })

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'The submissions proxy failed',
      expect.objectContaining({ extra: { status: null, code: null, error: 'TypeError' } }),
    )
  })

  it('leaves a failed captcha and a rate limit unreported: that is the gate working', async () => {
    request.mockRejectedValueOnce(sdkError(403, 'captcha_failed'))
    request.mockRejectedValueOnce(sdkError(429, 'rate_limited'))

    await submit({ token: 'stale' })
    await submit({ token: 'turnstile-token' })

    expect(Sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('reports an uncoded 403 every time: that is SahajCloud refusing our key', async () => {
    // What production answers a key it does not accept: Payload's Forbidden,
    // `{ errors: [{ message }] }`, with no code.
    request.mockRejectedValue(sdkError(403))

    await submit({ token: 'turnstile-token' })
    await submit({ token: 'turnstile-token' })

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(2)
    expect(Sentry.captureMessage).toHaveBeenCalledWith('The submissions proxy failed', {
      level: 'error',
      tags: { source: 'submissions' },
      extra: { status: 403, code: null, error: 'Error' },
    })
  })

  it('reports a refused draft read, whose caller it has already verified', async () => {
    request.mockRejectedValue(sdkError(403))

    await populate({ token: await sign(NOW() + 600) })

    expect(Sentry.captureMessage).toHaveBeenCalledWith('The live-preview populate proxy failed', {
      level: 'error',
      tags: { source: 'live-preview populate' },
      extra: { status: 403, code: null, error: 'Error' },
    })
  })

  it('reports a 400 once per code per isolate', async () => {
    // Codes no other case uses: the memo outlives a test.
    request.mockRejectedValueOnce(sdkError(400, 'disposable_email'))
    request.mockRejectedValueOnce(sdkError(400, 'disposable_email'))
    request.mockRejectedValueOnce(sdkError(400, 'urls_not_allowed'))

    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect((await submit({ token: 'turnstile-token' })).status).toBe(400)
    }

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(2)
    expect(reported()).toContain('"code":"disposable_email"')
    expect(reported()).toContain('"code":"urls_not_allowed"')
    expect(vi.mocked(Sentry.captureMessage).mock.calls[0][1]).toMatchObject({ level: 'warning' })
  })

  it('reports none of the refusals it answers itself', async () => {
    await submit()
    await submit({ body: { form: 'contact-form' }, token: 'turnstile-token' })

    expect(Sentry.captureMessage).not.toHaveBeenCalled()
  })
})
