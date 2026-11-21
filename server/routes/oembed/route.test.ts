import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'
import type { SahajCloudEnv } from '@/server/sahajcloud/context'
import { EN_TRANSLATIONS } from '@/lib/i18n/i18n'

/**
 * The status codes `/oembed` answers with, and the one thing it must never do:
 * answer for a URL that is not ours.
 *
 * The reads are mocked, because what is under test is the routing and the
 * refusals. `oembed.test.ts` covers the response body.
 */
const { getLecture, getDocumentById } = vi.hoisted(() => ({
  getLecture: vi.fn(),
  getDocumentById: vi.fn(),
}))

vi.mock('@/server/sahajcloud/client', () => ({
  getLecture,
  getDocumentById,
  getWebTranslations: vi.fn(async () => EN_TRANSLATIONS),
}))

const { registerOEmbedRoutes } = await import('./route')

const ORIGIN = 'https://wemeditate.com'

function app() {
  const hono = new Hono<SahajCloudEnv>()

  registerOEmbedRoutes(hono)

  return hono
}

const call = (query: string) => app().request(`${ORIGIN}/oembed${query}`)

describe('GET /oembed', () => {
  it('answers a lecture URL with its player', async () => {
    getLecture.mockResolvedValueOnce({ title: 'A lecture', thumbnailUrl: null })

    const response = await call(`?url=${encodeURIComponent(`${ORIGIN}/lectures/163`)}`)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      type: 'video',
      title: 'A lecture',
      html: expect.stringContaining(`${ORIGIN}/lectures/163/embed`),
    })
  })

  it('answers a meditation URL with its player', async () => {
    getDocumentById.mockResolvedValueOnce({ title: 'Morning', thumbnail: null })

    const response = await call(`?url=${encodeURIComponent(`${ORIGIN}/meditations/142`)}`)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ title: 'Morning' })
  })

  it('refuses a URL on another host without reading anything', async () => {
    const response = await call(`?url=${encodeURIComponent('https://evil.test/lectures/163')}`)

    expect(response.status).toBe(404)
    expect(getLecture).not.toHaveBeenCalled()
    expect(getDocumentById).not.toHaveBeenCalled()
  })

  it.each([
    ['no url at all', ''],
    ['a page, which has no player', `?url=${encodeURIComponent(`${ORIGIN}/kundalini`)}`],
  ])('refuses %s', async (_label, query) => {
    expect((await call(query)).status).toBe(404)
  })

  it('refuses a document the read could not find', async () => {
    getLecture.mockResolvedValueOnce(null)

    expect((await call(`?url=${encodeURIComponent(`${ORIGIN}/lectures/999`)}`)).status).toBe(404)
  })

  it('answers 501 for a format it does not implement, as the spec says', async () => {
    const response = await call(`?url=${encodeURIComponent(`${ORIGIN}/lectures/163`)}&format=xml`)

    expect(response.status).toBe(501)
  })

  it('reads the player in the locale the consumer’s URL named', async () => {
    getLecture.mockResolvedValueOnce({ title: 'Une conférence', thumbnailUrl: null })

    const response = await call(`?url=${encodeURIComponent(`${ORIGIN}/fr/lectures/163`)}`)

    expect(getLecture).toHaveBeenCalledWith(expect.objectContaining({ locale: 'fr' }))
    await expect(response.json()).resolves.toMatchObject({
      html: expect.stringContaining(`${ORIGIN}/fr/lectures/163/embed`),
    })
  })
})
