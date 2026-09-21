import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cmsFetch, CmsResponseError, fetchWithErrorDetails, throwIfNotOk } from './cms-fetch'
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

  it.each(['@evil.example/api/pages', '//evil.example/api/pages', 'api/pages'])(
    'refuses %s rather than sign a request it cannot place on the CMS origin',
    async (path) => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')

      // `https://cms.test` + `@evil.example/…` parses with `cms.test` as
      // userinfo and `evil.example` as the host, which would hand the API key
      // to whoever answers there.
      await expect(cmsFetch(path)).rejects.toThrow('site-relative path')
      expect(fetchSpy).not.toHaveBeenCalled()
    },
  )

  it('stays quiet on a 404, which every caller treats as an answer', async () => {
    const errorSpy = vi.spyOn(console, 'error')

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ errors: [] }), { status: 404 }),
    )

    await cmsFetch('/api/meditations/999/songs')

    // The request line still records it. Dumping a body here would buffer one
    // on a hot path and make an ordinary stale link look like a fault.
    expect(errorSpy).not.toHaveBeenCalled()
  })
})

describe('fetchWithErrorDetails', () => {
  it('dumps a 404 body by default, which is how the SDK collection reads see one', async () => {
    const errorSpy = vi.spyOn(console, 'error')

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ errors: [{ message: 'The requested resource was not found.' }] }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    // Only `cmsFetch` asks for a quiet 404. A collection read reaching this
    // wrapper through the SDK has no caller-side 404 policy, so its body is
    // the only record of which read missed.
    await fetchWithErrorDetails('https://cms.test/api/pages/missing')

    expect(errorSpy).toHaveBeenCalledWith(
      '[PayloadCMS] Error response:',
      expect.objectContaining({
        body: { errors: [{ message: 'The requested resource was not found.' }] },
      }),
    )
  })
})

describe('throwIfNotOk', () => {
  it('passes an OK response through', () => {
    expect(() => throwIfNotOk(new Response('{}', { status: 200 }), 'read')).not.toThrow()
  })

  it('names what failed and carries the status', () => {
    const error = (() => {
      try {
        throwIfNotOk(new Response('{}', { status: 522 }), 'getAtlasSeo(/gb/london)')
      } catch (thrown) {
        return thrown
      }
    })()

    expect(error).toBeInstanceOf(CmsResponseError)
    expect((error as CmsResponseError).message).toBe('getAtlasSeo(/gb/london) failed: 522')
    expect((error as CmsResponseError).status).toBe(522)
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
