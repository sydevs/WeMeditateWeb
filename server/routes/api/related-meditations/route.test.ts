import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SahajCloudEnv } from '@/server/sahajcloud/context'
import { stubUpstream } from '@/server/routes/api/_testing'

/**
 * ⚠ The cache header is the contract under test. These answers are cached in
 * the browser and the CDN, so an empty section cached after a failed read
 * outlives the failure by up to half an hour.
 */

const { captureMessage } = vi.hoisted(() => ({ captureMessage: vi.fn() }))

vi.mock('@/server/sahajcloud/context', () => ({
  getSahajCloudContext: () => ({ apiKey: 'test-key', baseURL: 'https://sahajcloud.test' }),
}))
// Both SDKs re-export `@sentry/core`'s one `captureMessage`; `degrade` reports
// through `@sentry/react` (see error-utils.ts).
vi.mock('@sentry/cloudflare', () => ({ captureMessage }))
vi.mock('@sentry/react', () => ({ captureMessage }))
// One attempt, so no test waits on real backoff. error-utils.test.ts covers
// what withRetry itself does.
vi.mock('@/server/error-utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/error-utils')>()),
  withRetry: (fn: () => unknown) => fn(),
}))

const { registerRelatedMeditations } = await import('./route')

const CACHED = 'public, max-age=300, stale-while-revalidate=1800'

const fetchMock = vi.fn()

function get(path: string) {
  const app = new Hono<SahajCloudEnv>()

  registerRelatedMeditations(app)

  return app.request(`https://wemeditate.com${path}`)
}

beforeEach(() => {
  captureMessage.mockReset()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('GET /api/related-meditations/:lectureId', () => {
  it('answers the cards, cached', async () => {
    stubUpstream(fetchMock, 200, {
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
    stubUpstream(fetchMock, 404)

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
    stubUpstream(fetchMock, 500)

    const response = await get('/api/related-meditations/163')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ items: [] })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })
})
