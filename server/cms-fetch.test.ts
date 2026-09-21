import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cmsFetch, CmsResponseError } from './cms-fetch'
import { detectErrorType, ErrorType } from './error-utils'

vi.mock('./cms-context', () => ({
  getCmsContext: () => ({ apiKey: 'test-key', baseURL: 'https://cms.test' }),
}))

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('cmsFetch', () => {
  it('resolves the path against the CMS base URL and signs the request', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }))

    await cmsFetch('/api/atlas/seo?route=%2Fgb')

    const [url, init] = fetchSpy.mock.calls[0]

    expect(url).toBe('https://cms.test/api/atlas/seo?route=%2Fgb')
    expect((init as RequestInit).headers).toEqual({ Authorization: 'clients API-Key test-key' })
  })

  it('logs every request in the form the debugging workflow reads', async () => {
    const logSpy = vi.spyOn(console, 'log')

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))

    await cmsFetch('/api/pages?limit=1')

    expect(logSpy).toHaveBeenCalledWith('[PayloadCMS] GET https://cms.test/api/pages?limit=1 → 200')
  })

  it('dumps the CMS error body on a non-OK response, which carries the field it refused', async () => {
    const errorSpy = vi.spyOn(console, 'error')

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ errors: [{ message: 'select is required' }] }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const response = await cmsFetch('/api/pages')

    // The response is handed back unread: each call site owns its own non-OK
    // policy, and the body is still available to it.
    expect(response.status).toBe(400)
    expect(errorSpy).toHaveBeenCalledWith(
      '[PayloadCMS] Error response:',
      expect.objectContaining({ body: { errors: [{ message: 'select is required' }] } }),
    )
  })
})

describe('CmsResponseError', () => {
  it('keeps a Cloudflare-origin 522 retryable, which a plain Error does not', async () => {
    expect(detectErrorType(new CmsResponseError('read failed: 522', 522))).toBe(ErrorType.SERVER)
    expect(detectErrorType(new Error('read failed: 522'))).toBe(ErrorType.UNKNOWN)
  })

  it('classifies a 4xx as CLIENT, so a 403 never spends the retry ladder', async () => {
    expect(detectErrorType(new CmsResponseError('read failed: 403', 403))).toBe(ErrorType.CLIENT)
  })
})
