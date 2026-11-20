import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SUBMISSION_PATH, TURNSTILE_TOKEN_HEADER } from '../../../lib/submissions'
import type { SahajCloudEnv } from '../../sahajcloud-context'
import { SUBMISSION_BODY_LIMIT, submissionSchema } from '../../validation'
import { sdkError, submitRequest } from './_testing'

/**
 * ⚠ `/api/submissions` attaches `SAHAJCLOUD_API_KEY` on our side, so what it
 * forwards and what it hands back are both part of the gate. Every case below
 * asserts one of three things: the body is re-validated before SahajCloud is
 * called at all, the forwarded header set is exactly the captcha token and the
 * visitor's address, and a refusal carries the intake's code and never its
 * prose.
 */

const { request } = vi.hoisted(() => ({ request: vi.fn() }))

vi.mock('../../sahajcloud-context', () => ({
  getSahajCloudContext: () => ({
    apiKey: 'test-key',
    baseURL: 'https://sahajcloud.test',
  }),
}))
vi.mock('@sentry/cloudflare', () => ({ captureMessage: vi.fn(), captureException: vi.fn() }))
vi.mock('../../payload-client', () => ({ createPayloadClient: () => ({ request }) }))

const { registerSubmissions } = await import('./submissions')

beforeEach(() => {
  request.mockReset()
  request.mockResolvedValue(new Response(JSON.stringify({ id: 98, title: 'Edited' })))
})

function app() {
  const routes = new Hono<SahajCloudEnv>()

  registerSubmissions(routes)

  return routes
}

function submit(options: Parameters<typeof submitRequest>[1] = {}) {
  return submitRequest(app(), options)
}

describe('POST /api/submissions — the forward', () => {
  it('creates a user-submission from the validated body', async () => {
    const response = await submit({ token: 'turnstile-token' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })

    const sent = request.mock.calls[0][0]

    expect(sent.method).toBe('POST')
    expect(sent.path).toBe('/user-submissions')
    expect(sent.json).toMatchObject({ form: 12, type: 'contact' })
  })

  it('refuses a quoted form id, which the intake cannot resolve', async () => {
    // SahajCloud reads the relationship with `relationId()`, which answers
    // `null` for a string — so a quoted id would be accepted and then silently
    // refuse every authored field. See `SubmissionBody` in lib/submissions.ts.
    const response = await submit({
      body: { form: '12', type: 'contact', submissionData: [] },
      token: 'turnstile-token',
    })

    expect(response.status).toBe(400)
    expect(request).not.toHaveBeenCalled()
  })

  it('forwards the captcha token and the visitor, and nothing the browser sent', async () => {
    // Origin and Referer must not cross over: a server-to-server call is
    // exempt from the client's allowedDomains allowlist, and forwarding the
    // browser's host would put this site through it.
    //
    // Both names are spelled out rather than read from their constants. An
    // assertion built from the symbol it is checking stays green through a
    // rename that silently drops the header upstream.
    await submit({ token: 'turnstile-token', clientIp: '203.0.113.7' })

    expect(request.mock.calls[0][0].init.headers).toEqual({
      'x-turnstile-token': 'turnstile-token',
      'x-client-ip': '203.0.113.7',
    })
  })

  it('sends no visitor address at all when our own request carries none', async () => {
    // Upstream falls back to the address it sees when the header is absent.
    await submit({ token: 'turnstile-token' })

    expect(request.mock.calls[0][0].init.headers).toEqual({
      'x-turnstile-token': 'turnstile-token',
    })
  })

  it('asks SahajCloud to populate nothing, since nothing reads the response', async () => {
    await submit({ token: 'turnstile-token' })

    expect(request.mock.calls[0][0].args).toEqual({ depth: 0 })
  })

  it('echoes none of the created row back', async () => {
    request.mockResolvedValue(new Response(JSON.stringify({ doc: { id: 5, uuid: 'secret' } })))

    const response = await submit({ token: 'turnstile-token' })

    expect(await response.text()).toBe('{"ok":true}')
  })
})

describe('POST /api/submissions — the body gate', () => {
  it('refuses a body the schema rejects, without calling SahajCloud', async () => {
    const response = await submit({ body: { form: 'contact-form', type: 'contact' } })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ ok: false, code: 'invalid_request' })
    expect(request).not.toHaveBeenCalled()
  })

  it('refuses a type this site does not submit, without calling SahajCloud', async () => {
    // Registrations and proposals are the atlas widget's, and name an event
    // rather than a form.
    const response = await submit({
      body: { form: 12, type: 'registration', submissionData: [] },
    })

    expect(response.status).toBe(400)
    expect(request).not.toHaveBeenCalled()
  })

  it('refuses a body past what submissionSchema allows', async () => {
    const response = await submit({
      body: {
        form: 12,
        type: 'contact',
        submissionData: Array.from({ length: 41 }, (_, index) => ({
          field: `f${index}`,
          value: 'x',
        })),
      },
    })

    expect(response.status).toBe(400)
    expect(request).not.toHaveBeenCalled()
  })

  it('refuses a body that does not parse, without calling SahajCloud', async () => {
    const response = await app().request(`https://wemeditate.com${SUBMISSION_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    })

    expect(response.status).toBe(400)
    expect(request).not.toHaveBeenCalled()
  })

  it('refuses a body not declared JSON, without calling SahajCloud', async () => {
    const response = await submit({ token: 'turnstile-token', contentType: 'text/plain' })

    expect(response.status).toBe(415)
    expect(await response.json()).toEqual({ ok: false, code: 'invalid_request' })
    expect(request).not.toHaveBeenCalled()
  })

  it('takes a JSON content type with parameters', async () => {
    const response = await submit({
      token: 'turnstile-token',
      contentType: 'Application/JSON; charset=utf-8',
    })

    expect(response.status).toBe(200)
  })

  it('refuses a body past the size bound unread, without calling SahajCloud', async () => {
    const response = await submit({
      token: 'turnstile-token',
      body: {
        form: 12,
        type: 'contact',
        submissionData: [{ field: 'message', value: 'x'.repeat(SUBMISSION_BODY_LIMIT) }],
      },
    })

    expect(response.status).toBe(413)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toEqual({ ok: false, code: 'invalid_request' })
    expect(request).not.toHaveBeenCalled()
  })

  it('never refuses a body the schema accepts for its size', async () => {
    // Every bound at its maximum, in the character JSON escapes longest.
    const worst = '\u0001'
    const body = {
      form: 12,
      type: 'contact',
      senderEmail: `${'a'.repeat(64)}@${'b'.repeat(185)}.org`,
      submissionData: Array.from({ length: 40 }, (_, index) => ({
        field: `${index}`.padEnd(100, worst),
        value: worst.repeat(5000),
      })),
    }

    expect(submissionSchema.safeParse(body).success).toBe(true)

    const response = await submit({ token: 'turnstile-token', body })

    expect(response.status).toBe(200)
    expect(request).toHaveBeenCalledOnce()
  })
})

describe('POST /api/submissions — the captcha token', () => {
  it('answers a tokenless submission as SahajCloud would, without calling it', async () => {
    const response = await submit()

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ ok: false, code: 'captcha_failed' })
    expect(request).not.toHaveBeenCalled()
  })

  it('reads an empty token as none', async () => {
    const response = await app().request(`https://wemeditate.com${SUBMISSION_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [TURNSTILE_TOKEN_HEADER]: '' },
      body: JSON.stringify({ form: 12, type: 'contact', submissionData: [] }),
    })

    expect(response.status).toBe(403)
    expect(request).not.toHaveBeenCalled()
  })
})

describe('POST /api/submissions — a refusal', () => {
  it('passes the intake code through, and never its message', async () => {
    request.mockRejectedValue(sdkError(403, 'captcha_failed'))

    const response = await submit({ token: 'stale' })

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ ok: false, code: 'captcha_failed' })
  })

  it('keeps a 400 a 400, so a refused pair still reads as the caller’s fault', async () => {
    request.mockRejectedValue(sdkError(400, 'submission_data_invalid'))

    const response = await submit({ token: 'turnstile-token' })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ ok: false, code: 'submission_data_invalid' })
  })

  it('reads a SahajCloud fault as 502, not as the browser sending a bad request', async () => {
    request.mockRejectedValue(sdkError(500, 'internal'))

    const response = await submit({ token: 'turnstile-token' })

    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ ok: false })
  })

  it('reads an unreachable SahajCloud as 502', async () => {
    request.mockRejectedValue(new Error('fetch failed'))

    const response = await submit({ token: 'turnstile-token' })

    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ ok: false })
  })
})
