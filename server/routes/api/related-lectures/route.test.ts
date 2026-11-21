import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SahajCloudEnv } from '@/server/sahajcloud/context'
import { stubUpstream } from '@/server/routes/api/_testing'

/**
 * ⚠ The cache header is the contract under test. These answers are cached in
 * the browser and the CDN, so an empty section cached after a failed read
 * outlives the failure by up to half an hour.
 */

const { captureMessage, findGlobal } = vi.hoisted(() => ({
  captureMessage: vi.fn(),
  findGlobal: vi.fn(),
}))

vi.mock('@/server/sahajcloud/context', () => ({
  getSahajCloudContext: () => ({ apiKey: 'test-key', baseURL: 'https://sahajcloud.test' }),
}))
// Both SDKs re-export `@sentry/core`'s one `captureMessage`; `degrade` reports
// through `@sentry/react` (see error-utils.ts).
vi.mock('@sentry/cloudflare', () => ({ captureMessage }))
vi.mock('@sentry/react', () => ({ captureMessage }))
vi.mock('@/server/sahajcloud/payload-client', () => ({
  createPayloadClient: () => ({ findGlobal }),
}))
// One attempt, so no test waits on real backoff. error-utils.test.ts covers
// what withRetry itself does.
vi.mock('@/server/error-utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/error-utils')>()),
  withRetry: (fn: () => unknown) => fn(),
}))

const { registerRelatedLectures } = await import('./route')

const CACHED = 'public, max-age=300, stale-while-revalidate=1800'

const fetchMock = vi.fn()

function get(path: string) {
  const app = new Hono<SahajCloudEnv>()

  registerRelatedLectures(app)

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

describe('GET /api/related-lectures/:meditationId', () => {
  it('answers the cards for the site’s audiences, cached', async () => {
    stubUpstream(fetchMock, 200, {
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
    stubUpstream(fetchMock, 503)

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
