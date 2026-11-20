import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SahajCloudEnv } from './sahajcloud-context'

/**
 * The related-content routes, apart from `api-routes.test.ts`: they read
 * through `fetch` and the config global, where the proxies there stub the
 * SDK's `request`.
 *
 * ⚠ The cache header is the contract under test. These answers are cached in
 * the browser and the CDN, so an empty section cached after a failed read
 * outlives the failure by up to half an hour.
 */

const { captureMessage, findGlobal } = vi.hoisted(() => ({
  captureMessage: vi.fn(),
  findGlobal: vi.fn(),
}))

vi.mock('./sahajcloud-context', () => ({
  getSahajCloudContext: () => ({ apiKey: 'test-key', baseURL: 'https://sahajcloud.test' }),
}))
// Both SDKs re-export `@sentry/core`'s one `captureMessage`; `degrade` reports
// through `@sentry/react` (see error-utils.ts).
vi.mock('@sentry/cloudflare', () => ({ captureMessage }))
vi.mock('@sentry/react', () => ({ captureMessage }))
vi.mock('./payload-client', () => ({ createPayloadClient: () => ({ findGlobal }) }))
// One attempt, so no test waits on real backoff. error-utils.test.ts covers
// what withRetry itself does.
vi.mock('./error-utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./error-utils')>()),
  withRetry: (fn: () => unknown) => fn(),
}))

const { registerApiRoutes } = await import('./api-routes')

const CACHED = 'public, max-age=300, stale-while-revalidate=1800'

const fetchMock = vi.fn()

/** Answers every `fetch` with this status and JSON body. */
function upstream(status: number, body: unknown = {}) {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    json: async () => body,
  }

  // sahajCloudFetch clones a non-OK response to dump the SahajCloud error body.
  fetchMock.mockResolvedValue({ ...response, clone: () => response })
}

function get(path: string) {
  const app = new Hono<SahajCloudEnv>()

  registerApiRoutes(app)

  return app.request(`https://wemeditate.com${path}`)
}

beforeEach(() => {
  captureMessage.mockReset()
  findGlobal.mockReset()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  findGlobal.mockResolvedValue({ id: 1, audiences: [1] })
})

describe('GET /api/related-meditations/:lectureId', () => {
  it('answers the cards, cached', async () => {
    upstream(200, {
      docs: [
        {
          id: 141,
          title: 'Meditation for Vishuddhi',
          durationMinutes: 19,
          thumbnailUrl: 'https://imagedelivery.net/acct/abc/public',
        },
      ],
    })

    const response = await get('/api/related-meditations/163?locale=en')

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe(CACHED)
    expect((await response.json()).items).toEqual([
      expect.objectContaining({ id: 141, href: '/meditations/141' }),
    ])
    expect(fetchMock.mock.calls[0][0]).toContain('/api/lectures/163/related-meditations')
  })

  it('caches an empty answer that is real: an unknown lecture', async () => {
    upstream(404)

    const response = await get('/api/related-meditations/999999')

    expect(await response.json()).toEqual({ items: [] })
    expect(response.headers.get('Cache-Control')).toBe(CACHED)
  })

  it('refuses an id that is not one, without calling SahajCloud', async () => {
    const response = await get('/api/related-meditations/abc')

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ items: [] })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('answers empty, and never cached, when the read fails', async () => {
    upstream(500)

    const response = await get('/api/related-meditations/163')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ items: [] })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })
})

describe('GET /api/related-lectures/:meditationId', () => {
  it('answers the cards for the site’s audiences, cached', async () => {
    upstream(200, {
      docs: [
        {
          id: 150,
          title: 'Truth Has to Be Experienced',
          duration: 952,
          thumbnailUrl: 'https://img.youtube.com/vi/abc/mqdefault.jpg',
        },
      ],
    })

    const response = await get('/api/related-lectures/142?locale=en')

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe(CACHED)
    expect((await response.json()).items).toEqual([
      expect.objectContaining({ id: 150, href: '/lectures/150' }),
    ])
    expect(fetchMock.mock.calls[0][0]).toContain('audiences=1')
  })

  it('refuses an id that is not one, without calling SahajCloud', async () => {
    const response = await get('/api/related-lectures/-4')

    expect(response.status).toBe(400)
    expect(findGlobal).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('answers empty, and never cached, when the read fails', async () => {
    upstream(503)

    const response = await get('/api/related-lectures/142')

    expect(await response.json()).toEqual({ items: [] })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  it('answers empty, and never cached, when the config read behind it fails', async () => {
    findGlobal.mockRejectedValue(new Error('SahajCloud unavailable'))

    const response = await get('/api/related-lectures/142')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ items: [] })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
