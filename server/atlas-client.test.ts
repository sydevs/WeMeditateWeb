import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAtlasSeo, getAtlasSitemapUrls } from './atlas-client'
import * as Sentry from '@sentry/react'
import { detectErrorType, ErrorType } from './error-utils'

vi.mock('./cms-context', () => ({
  getCmsContext: () => ({ apiKey: 'test-key', baseURL: 'https://cms.test' }),
}))
vi.mock('@sentry/react', () => ({ captureMessage: vi.fn() }))

// The stub runs the read once, so no test waits on real backoff.
// `retrySpy` keeps the call visible to the tests that assert one, and
// `thrownSpy` the error the ladder was handed, which is what decides
// whether a real withRetry would try again.
// error-utils.test.ts covers what withRetry itself does.
const { retrySpy, thrownSpy } = vi.hoisted(() => ({ retrySpy: vi.fn(), thrownSpy: vi.fn() }))

vi.mock('./error-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./error-utils')>()

  return {
    ...actual,
    withRetry: async (fn: () => unknown, config?: unknown) => {
      retrySpy(config)

      return Promise.resolve()
        .then(fn)
        .catch((error: unknown) => {
          thrownSpy(error)

          throw error
        })
    },
  }
})

/** Builds a fetch Response stub for the given status and JSON body. */
function fetchResponse(status: number, body: unknown) {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    json: async () => body,
  }

  // sahajCloudFetch clones a non-OK response to dump the CMS error body.
  return { ...response, clone: () => response }
}

const regionAnswer = { type: 'region', id: 5, route: '/gb/london', title: 'London' }

beforeEach(() => {
  retrySpy.mockClear()
  thrownSpy.mockClear()
  // `restoreAllMocks` restores spies, and leaves a module mock's recorded
  // calls in place — so without this a test cannot assert Sentry stayed
  // silent.
  vi.mocked(Sentry.captureMessage).mockClear()
  vi.restoreAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('getAtlasSeo', () => {
  it('asks the endpoint for the route and returns the answer verbatim', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(fetchResponse(200, regionAnswer) as unknown as Response)

    const result = await getAtlasSeo({ route: '/gb/london', locale: 'en' })

    expect(result).toEqual(regionAnswer)

    const [url, init] = fetchSpy.mock.calls[0]

    expect(url).toBe('https://cms.test/api/atlas/seo?route=%2Fgb%2Flondon&locale=en')
    expect((init as RequestInit).headers).toEqual({
      Authorization: 'clients API-Key test-key',
    })
  })

  it('passes the locale through, since the answer is rendered for it', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      fetchResponse(200, regionAnswer) as unknown as Response,
    )

    await getAtlasSeo({ route: '/nl/amsterdam', locale: 'nl' })

    expect(vi.mocked(globalThis.fetch).mock.calls[0][0]).toContain('&locale=nl')
  })

  describe('retry policy', () => {
    it('retries a failing read, since the KV layer used to supply that', async () => {
      // `withCache` ran `withRetry` on every miss (#98). Dropping the cache
      // must not drop the resilience with it: this read degrades to `null`,
      // so an unretried blip silently costs the page its server-rendered half.
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        fetchResponse(200, regionAnswer) as unknown as Response,
      )

      await getAtlasSeo({ route: '/gb/london', locale: 'en' })

      expect(retrySpy).toHaveBeenCalledTimes(1)
      expect(retrySpy.mock.calls[0][0]).toBeUndefined()
    })

    it('does not spend the retry ladder on a 404', async () => {
      // A dead route is an answer, not a fault. It returns rather than
      // throws, so `withRetry` resolves on the first attempt.
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        fetchResponse(404, { errors: [] }) as unknown as Response,
      )

      expect(await getAtlasSeo({ route: '/gb/gone', locale: 'en' })).toBeNull()
      expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledTimes(1)
    })

    it('carries the status so a Cloudflare 5xx still classifies as retryable', async () => {
      // 520/522/524 come from the edge in front of SahajCloud. They reach
      // `detectErrorType` only as a structured status — the message fallback
      // matches `50[0-9]` and would call them UNKNOWN, dropping the retry.
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        fetchResponse(522, {}) as unknown as Response,
      )

      await getAtlasSeo({ route: '/gb/london', locale: 'en' })

      expect(detectErrorType(thrownSpy.mock.calls[0][0])).toBe(ErrorType.SERVER)
    })
  })

  describe('routes that name no document', () => {
    it.each([
      ['the atlas root', '/'],
      ['a bare search view', '/search'],
      ['a spliced-in query string', '/gb/london?utm_source=x'],
    ])('returns null for %s without calling the endpoint', async (_label, route) => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')

      expect(await getAtlasSeo({ route, locale: 'en' })).toBeNull()
      // Never asking also stops a crawler that grinds through view routes
      // from reaching the endpoint at all.
      expect(fetchSpy).not.toHaveBeenCalled()
      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })
  })

  describe('degradation', () => {
    it('treats a 404 as an ordinary stale link — null, and no Sentry noise', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        fetchResponse(404, { errors: [] }) as unknown as Response,
      )

      expect(await getAtlasSeo({ route: '/gb/gone', locale: 'en' })).toBeNull()
      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })

    it.each([
      ['a 403 from a client without the atlas role', 403],
      ['a server fault', 500],
    ])('degrades to widget-only and warns Sentry on %s', async (_label, status) => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        fetchResponse(status, { errors: [] }) as unknown as Response,
      )

      // The page must still render. The widget works without server
      // rendering, and a lost server-rendered half makes a degraded page,
      // not a broken one.
      expect(await getAtlasSeo({ route: '/gb/london', locale: 'en' })).toBeNull()
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining('getAtlasSeo failed'),
        expect.objectContaining({ level: 'warning' }),
      )
    })

    it('throws a 522 the retry ladder classifies as SERVER, not UNKNOWN', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        fetchResponse(522, { errors: [] }) as unknown as Response,
      )

      await getAtlasSeo({ route: '/gb/london', locale: 'en' })

      // `detectErrorType` falls back to matching `50[0-9]` in the message,
      // which a Cloudflare-origin 5xx never contains. Only the status on the
      // error keeps it retryable.
      expect(detectErrorType(thrownSpy.mock.calls[0][0])).toBe(ErrorType.SERVER)
    })

    it('degrades on a network fault rather than throwing into the render', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'))

      expect(await getAtlasSeo({ route: '/gb/london', locale: 'en' })).toBeNull()
      expect(Sentry.captureMessage).toHaveBeenCalled()
    })
  })
})

describe('getAtlasSitemapUrls', () => {
  /**
   * A `GET /api/atlas/sitemap` body.
   *
   * Shape mirrored from SahajCloud's `src/endpoints/responseTypes.ts` and
   * built by `src/endpoints/atlas/sitemap/sitemapUrls.ts`: `loc` is the
   * document's own `webUrl`, so it is absolute and carries the client's
   * `/map` mount, and every row has a `lastmod` and a `route`.
   */
  function sitemapResponse(urls: { loc: string; lastmod?: string }[]) {
    return fetchResponse(200, {
      generated: '2026-09-21T00:00:00.000Z',
      urls: urls.map((url, index) => ({
        lastmod: '2026-01-01T00:00:00.000Z',
        route: `/r${index}`,
        ...url,
      })),
    }) as unknown as Response
  }

  it('asks the client-scoped endpoint, not the collections', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        sitemapResponse([{ loc: 'https://wemeditate.com/map/gb/london', lastmod: '2026-01-01' }]),
      )

    const urls = await getAtlasSitemapUrls('https://wemeditate.com')

    expect(urls).toEqual([{ loc: 'https://wemeditate.com/map/gb/london', lastmod: '2026-01-01' }])

    const [url, init] = fetchSpy.mock.calls[0]

    expect(url).toBe('https://cms.test/api/atlas/sitemap')
    expect((init as RequestInit).headers).toEqual({
      Authorization: 'clients API-Key test-key',
    })
  })

  it('keeps every URL past the old 2,000-document ceiling', async () => {
    // The read this replaced walked 500 × 4 documents per collection and
    // filtered to this origin only afterwards, so growth anywhere in the
    // atlas truncated this site's half of the sitemap (#123). Bulk event
    // import by country puts the corpus well past that (SahajCloud #828).
    const events = Array.from({ length: 2_500 }, (_, index) => ({
      loc: `https://wemeditate.com/map/gb/london/${index}`,
    }))

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(sitemapResponse(events))

    const urls = await getAtlasSitemapUrls('https://wemeditate.com')

    expect(urls).toHaveLength(2_500)
    expect(urls.at(-1)?.loc).toBe('https://wemeditate.com/map/gb/london/2499')
  })

  it('caps the list and reports the truncation rather than hiding it', async () => {
    // The cap holds the document to the sitemap spec's 50,000-URL limit,
    // not the Worker request. A silent cut is what #123 was.
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      sitemapResponse(
        Array.from({ length: 45_010 }, (_, index) => ({
          loc: `https://wemeditate.com/map/gb/london/${index}`,
        })),
      ),
    )

    expect(await getAtlasSitemapUrls('https://wemeditate.com')).toHaveLength(45_000)
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining('truncated'),
      expect.objectContaining({ level: 'warning' }),
    )
  })

  it('drops a URL that is not on the origin being served', async () => {
    // Upstream scopes to what this client owns, so this is a guard against
    // a key whose canonical domain is not the host serving the request.
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      sitemapResponse([
        { loc: 'https://wemeditate.com/map/gb/london' },
        { loc: 'https://sahajayoga.nl/map/nl/amsterdam' },
      ]),
    )

    const urls = await getAtlasSitemapUrls('https://wemeditate.com')

    expect(urls.map((url) => url.loc)).toEqual(['https://wemeditate.com/map/gb/london'])
  })

  it('reports a sitemap the origin guard emptied completely', async () => {
    // In the response this is indistinguishable from a client that owns no
    // subtree, so Sentry is the only place it can surface.
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      sitemapResponse([{ loc: 'https://sahajayoga.nl/map/nl/amsterdam' }]),
    )

    expect(await getAtlasSitemapUrls('https://wemeditate.com')).toEqual([])
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining('off-origin'),
      expect.objectContaining({ level: 'warning' }),
    )
  })

  it('stays quiet when the client legitimately owns nothing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(sitemapResponse([]))

    expect(await getAtlasSitemapUrls('https://wemeditate.com')).toEqual([])
    expect(Sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('wraps the read in withRetry, since the KV layer used to supply that', async () => {
    // This read degrades to `[]`, so an unretried blip costs the sitemap
    // its atlas half with nothing visible in the response (#98).
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(sitemapResponse([]))

    await getAtlasSitemapUrls('https://wemeditate.com')

    expect(retrySpy).toHaveBeenCalledTimes(1)
    expect(retrySpy.mock.calls[0][0]).toBeUndefined()
  })

  it('carries the status so a Cloudflare 5xx still classifies as retryable', async () => {
    // 520/522/524 come from the edge in front of SahajCloud. They reach
    // `detectErrorType` only as a structured status — the message fallback
    // matches `50[0-9]` and would call them UNKNOWN, dropping the retry.
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      fetchResponse(522, {}) as unknown as Response,
    )

    await getAtlasSitemapUrls('https://wemeditate.com')

    expect(detectErrorType(thrownSpy.mock.calls[0][0])).toBe(ErrorType.SERVER)
  })

  it('treats a 200 whose body lost its urls array as a failure, not as empty', async () => {
    // Hand-mirrored types, so an upstream rename compiles and passes. Left
    // as `[]` it would empty the atlas half with nothing logged.
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      fetchResponse(200, { generated: '2026-09-21T00:00:00.000Z' }) as unknown as Response,
    )

    expect(await getAtlasSitemapUrls('https://wemeditate.com')).toEqual([])
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining('getAtlasSitemapUrls failed'),
      expect.objectContaining({ level: 'warning' }),
    )
  })

  it('degrades to an empty list rather than failing the sitemap', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('upstream is down'))

    expect(await getAtlasSitemapUrls('https://wemeditate.com')).toEqual([])
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining('getAtlasSitemapUrls failed'),
      expect.objectContaining({ level: 'warning' }),
    )
  })

  it('degrades on a refusal, the shape local dev sees', async () => {
    // The atlas endpoints require the `sahaj-atlas-client` role, which the
    // LOCAL client lacks. A 403 costs the atlas half, never the route.
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(fetchResponse(403, {}) as unknown as Response)

    expect(await getAtlasSitemapUrls('https://wemeditate.com')).toEqual([])
    // A refusal that degrades without a trace is the failure this whole
    // file guards against, so the warning is part of the contract.
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining('getAtlasSitemapUrls failed'),
      expect.objectContaining({ level: 'warning' }),
    )
    expect(detectErrorType(thrownSpy.mock.calls[0][0])).toBe(ErrorType.CLIENT)
  })
})
