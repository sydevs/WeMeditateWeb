import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAtlasSeo, getAtlasSitemapUrls } from './atlas-client'
import * as Sentry from '@sentry/react'

vi.mock('./cms-context', () => ({
  getCmsContext: () => ({ apiKey: 'test-key', baseURL: 'https://cms.test' }),
}))
vi.mock('@sentry/react', () => ({ captureMessage: vi.fn() }))

const find = vi.fn()

vi.mock('./payload-client', () => ({ createPayloadClient: () => ({ find }) }))

// The stub runs the read once, so no test waits on real backoff.
// `retrySpy` keeps the call visible to the tests that assert one.
// error-utils.test.ts covers what withRetry itself does.
const { retrySpy } = vi.hoisted(() => ({ retrySpy: vi.fn() }))

vi.mock('./error-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./error-utils')>()

  return {
    ...actual,
    withRetry: (fn: () => unknown, config?: unknown) => {
      retrySpy(config)

      return fn()
    },
  }
})

/** Builds a fetch Response stub for the given status and JSON body. */
function fetchResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

const regionAnswer = { type: 'region', id: 5, route: '/gb/london', title: 'London' }

beforeEach(() => {
  retrySpy.mockClear()
  find.mockReset()
  vi.restoreAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
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

    it('degrades on a network fault rather than throwing into the render', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'))

      expect(await getAtlasSeo({ route: '/gb/london', locale: 'en' })).toBeNull()
      expect(Sentry.captureMessage).toHaveBeenCalled()
    })
  })
})

describe('getAtlasSitemapUrls', () => {
  it('lists only the URLs this origin is the canonical home of', async () => {
    // Atlas ownership works per subtree: most regions canonicalize to the
    // national site that owns them (#640). Listing those would ask a
    // crawler to index URLs this site itself marks non-canonical.
    find.mockImplementation(async ({ collection }: { collection: string }) => ({
      docs:
        collection === 'regions'
          ? [
              { webUrl: 'https://wemeditate.com/map/gb/london', updatedAt: '2026-01-01' },
              { webUrl: 'https://sahajayoga.nl/map/nl/amsterdam', updatedAt: '2026-01-02' },
            ]
          : [{ webUrl: 'https://wemeditate.com/map/gb/london/1204', updatedAt: '2026-01-03' }],
      hasNextPage: false,
    }))

    const urls = await getAtlasSitemapUrls('https://wemeditate.com')

    expect(urls.map((url) => url.loc)).toEqual([
      'https://wemeditate.com/map/gb/london',
      'https://wemeditate.com/map/gb/london/1204',
    ])
  })

  it('retries a failing read, since the KV layer used to supply that', async () => {
    // This read degrades to `[]`, so an unretried blip costs the sitemap
    // its atlas half with nothing visible in the response (#98).
    find.mockResolvedValue({ docs: [], hasNextPage: false })

    await getAtlasSitemapUrls('https://wemeditate.com')

    expect(retrySpy).toHaveBeenCalledTimes(1)
    expect(retrySpy.mock.calls[0][0]).toBeUndefined()
  })

  it('degrades to an empty list rather than failing the sitemap', async () => {
    find.mockRejectedValue(new Error('upstream is down'))

    expect(await getAtlasSitemapUrls('https://wemeditate.com')).toEqual([])
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining('getAtlasSitemapUrls failed'),
      expect.objectContaining({ level: 'warning' }),
    )
  })
})
