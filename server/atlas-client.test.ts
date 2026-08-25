import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAtlasSeo, AtlasCacheTTL } from './atlas-client'
import * as Sentry from '@sentry/react'

vi.mock('./cms-context', () => ({
  getCmsContext: () => ({ apiKey: 'test-key', baseURL: 'https://cms.test', kv: undefined }),
}))
vi.mock('@sentry/react', () => ({ captureMessage: vi.fn() }))

/** Records what the read asked the cache for, then runs the fetch uncached. */
const cacheCalls: Array<{ cacheKey: string; ttl: number }> = []

vi.mock('./kv-cache', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./kv-cache')>()

  return {
    ...actual,
    withCache: (opts: { cacheKey: string; ttl: number; fetchFn: () => unknown }) => {
      cacheCalls.push({ cacheKey: opts.cacheKey, ttl: opts.ttl })

      return opts.fetchFn()
    },
  }
})

/** Build a fetch Response stub for the given status + JSON body. */
function fetchResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

const regionAnswer = { type: 'region', id: 5, route: '/gb/london', title: 'London' }

beforeEach(() => {
  cacheCalls.length = 0
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

  describe('cache policy', () => {
    it('caches a region for an hour and a class for fifteen minutes', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        fetchResponse(200, regionAnswer) as unknown as Response,
      )

      await getAtlasSeo({ route: '/gb/london', locale: 'en' })
      await getAtlasSeo({ route: '/gb/london/1204', locale: 'en' })

      expect(cacheCalls.map((call) => call.ttl)).toEqual([
        AtlasCacheTTL.REGION,
        AtlasCacheTTL.EVENT,
      ])
    })

    it('collapses every URL naming one document onto a single cache entry', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        fetchResponse(200, regionAnswer) as unknown as Response,
      )

      // Legacy prefix, stale ancestry and a view segment all name London.
      for (const route of [
        '/gb/london',
        '/regions/gb/london',
        '/wrong/chain/london',
        '/gb/london/calendar',
      ]) {
        await getAtlasSeo({ route, locale: 'en' })
      }

      expect(new Set(cacheCalls.map((call) => call.cacheKey)).size).toBe(1)
    })

    it('keys a class separately from its region, and a locale from its siblings', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        fetchResponse(200, regionAnswer) as unknown as Response,
      )

      await getAtlasSeo({ route: '/gb/london', locale: 'en' })
      await getAtlasSeo({ route: '/gb/london/1204', locale: 'en' })
      await getAtlasSeo({ route: '/gb/london', locale: 'fr' })

      expect(new Set(cacheCalls.map((call) => call.cacheKey)).size).toBe(3)
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
      // Never asking also keeps a crawler grinding through view routes off the
      // endpoint entirely.
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

      // The page must still render: the widget works without us, and a lost
      // server-rendered half is a degraded page rather than a broken one.
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
