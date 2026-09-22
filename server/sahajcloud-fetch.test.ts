import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  sahajCloudFetch,
  sahajCloudFetchOptional,
  SahajCloudResponseError,
  fetchWithErrorDetails,
} from './sahajcloud-fetch'
import { detectErrorType, ErrorType } from './error-utils'

vi.mock('./sahajcloud-context', () => ({
  getCmsContext: () => ({ apiKey: 'test-key', baseURL: 'https://cms.test' }),
}))

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('sahajCloudFetch', () => {
  it('resolves the path against the CMS base URL and signs the request', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }))

    await sahajCloudFetch('/api/atlas/seo?route=%2Fgb', 'getAtlasSeo(/gb)')

    const [url, init] = fetchSpy.mock.calls[0]

    expect(url).toBe('https://cms.test/api/atlas/seo?route=%2Fgb')
    expect((init as RequestInit).headers).toEqual({ Authorization: 'clients API-Key test-key' })
  })

  it('logs every request in the form the debugging workflow reads', async () => {
    const logSpy = vi.spyOn(console, 'log')

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))

    await sahajCloudFetch('/api/pages?limit=1', 'read')

    expect(logSpy).toHaveBeenCalledWith('[PayloadCMS] GET https://cms.test/api/pages?limit=1 → 200')
  })

  it('returns the parsed body on an OK response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ docs: [{ id: 1 }] }), { status: 200 }),
    )

    expect(await sahajCloudFetch('/api/pages', 'read')).toEqual({ docs: [{ id: 1 }] })
  })

  it('throws a labelled SahajCloudResponseError on a non-OK response, and dumps the body', async () => {
    const errorSpy = vi.spyOn(console, 'error')

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ errors: [{ message: 'select is required' }] }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const error = await sahajCloudFetch('/api/pages', 'getPages()').catch((thrown) => thrown)

    expect(error).toBeInstanceOf(SahajCloudResponseError)
    expect((error as SahajCloudResponseError).message).toBe('getPages() failed: 400')
    expect((error as SahajCloudResponseError).status).toBe(400)
    expect(errorSpy).toHaveBeenCalledWith(
      '[PayloadCMS] Error response:',
      expect.objectContaining({ body: { errors: [{ message: 'select is required' }] } }),
    )
  })

  it('throws on a 404 and dumps its body, because no caller here answers one', async () => {
    const errorSpy = vi.spyOn(console, 'error')

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ errors: [] }), { status: 404 }),
    )

    await expect(sahajCloudFetch('/api/pages?where=…', 'contentIndex')).rejects.toBeInstanceOf(
      SahajCloudResponseError,
    )
    expect(errorSpy).toHaveBeenCalled()
  })

  it.each(['@evil.example/api/pages', '//evil.example/api/pages', 'api/pages'])(
    'refuses %s rather than sign a request it cannot place on the CMS origin',
    async (path) => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')

      // `https://cms.test` + `@evil.example/…` parses with `cms.test` as
      // userinfo and `evil.example` as the host, which would hand the API key
      // to whoever answers there.
      await expect(sahajCloudFetch(path, 'read')).rejects.toThrow('site-relative path')
      expect(fetchSpy).not.toHaveBeenCalled()
    },
  )
})

describe('sahajCloudFetchOptional', () => {
  it('answers a 404 with null, and stays quiet, because the caller treats one as an answer', async () => {
    const errorSpy = vi.spyOn(console, 'error')

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ errors: [] }), { status: 404 }),
    )

    expect(
      await sahajCloudFetchOptional('/api/meditations/999/songs', 'getMeditationSongs(999)'),
    ).toBe(null)

    // The request line still records it. Dumping a body here would buffer one
    // on a hot path and make an ordinary stale link look like a fault.
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('still throws every other non-OK response, so the retry ladder runs', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 522 }))

    const error = await sahajCloudFetchOptional('/api/atlas/seo', 'getAtlasSeo(/gb)').catch(
      (thrown) => thrown,
    )

    expect(error).toBeInstanceOf(SahajCloudResponseError)
    expect((error as SahajCloudResponseError).status).toBe(522)
  })

  it('returns the parsed body on an OK response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 5 }), { status: 200 }),
    )

    expect(await sahajCloudFetchOptional('/api/atlas/seo', 'getAtlasSeo(/gb)')).toEqual({ id: 5 })
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

    // Only `sahajCloudFetchOptional` asks for a quiet 404. A collection read reaching this
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

describe('SahajCloudResponseError', () => {
  it('keeps a Cloudflare-origin 522 retryable, which a plain Error does not', async () => {
    expect(detectErrorType(new SahajCloudResponseError('read failed: 522', 522))).toBe(
      ErrorType.SERVER,
    )
    expect(detectErrorType(new Error('read failed: 522'))).toBe(ErrorType.UNKNOWN)
  })

  it('classifies a 4xx as CLIENT, so a 403 never spends the retry ladder', async () => {
    expect(detectErrorType(new SahajCloudResponseError('read failed: 403', 403))).toBe(
      ErrorType.CLIENT,
    )
  })
})
