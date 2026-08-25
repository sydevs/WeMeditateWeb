import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import type { CmsEnv } from './cms-context'

const find = vi.fn()

vi.mock('./cms-context', () => ({
  getCmsContext: () => ({ apiKey: 'test-key', baseURL: 'https://cms.test', kv: undefined }),
}))
vi.mock('@sentry/react', () => ({ captureMessage: vi.fn() }))
vi.mock('./payload-client', () => ({ createPayloadClient: () => ({ find }) }))
vi.mock('./kv-cache', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./kv-cache')>()

  return { ...actual, withCache: (opts: { fetchFn: () => unknown }) => opts.fetchFn() }
})

const { registerSitemapRoutes } = await import('./sitemap-routes')

function app() {
  const instance = new Hono<CmsEnv>()

  registerSitemapRoutes(instance)

  return instance
}

const get = (path: string, origin = 'https://wemeditate.com') => app().request(`${origin}${path}`)

/** Payload's find(), answering per collection. */
function stubCollections(docs: Record<string, unknown[]>) {
  find.mockImplementation(async ({ collection }: { collection: string }) => ({
    docs: docs[collection] ?? [],
    hasNextPage: false,
  }))
}

beforeEach(() => {
  find.mockReset()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  stubCollections({})
})

describe('/robots.txt', () => {
  it('serves plain text that allows the real site and names the sitemap', async () => {
    const response = await get('/robots.txt')

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('text/plain')
    await expect(response.text()).resolves.toContain('Sitemap: https://wemeditate.com/sitemap.xml')
  })

  it('refuses crawlers on a preview deployment', async () => {
    const response = await get('/robots.txt', 'https://wemeditate-web-pr-62.workers.dev')

    await expect(response.text()).resolves.toContain('Disallow: /')
  })
})

describe('/sitemap.xml', () => {
  it('lists pages by slug and documents by id, plus the homepage', async () => {
    stubCollections({
      pages: [{ id: 1, slug: 'about', updatedAt: '2026-08-01T00:00:00.000Z' }],
      meditations: [{ id: 142, updatedAt: '2026-08-02T00:00:00.000Z' }],
      lectures: [{ id: 163, updatedAt: null }],
    })

    const xml = await (await get('/sitemap.xml')).text()

    expect(xml).toContain('<loc>https://wemeditate.com/</loc>')
    expect(xml).toContain('<loc>https://wemeditate.com/about</loc>')
    expect(xml).toContain('<loc>https://wemeditate.com/meditations/142</loc>')
    expect(xml).toContain('<loc>https://wemeditate.com/lectures/163</loc>')
    expect(xml).toContain('<lastmod>2026-08-01T00:00:00.000Z</lastmod>')
  })

  it('serves it as XML', async () => {
    const response = await get('/sitemap.xml')

    expect(response.headers.get('Content-Type')).toContain('application/xml')
  })

  it('skips a page with no slug rather than listing a URL that 404s', async () => {
    // An unpublished page comes back without one.
    stubCollections({
      pages: [
        { id: 2, slug: null },
        { id: 3, slug: 'contact' },
      ],
    })

    const xml = await (await get('/sitemap.xml')).text()

    expect(xml).toContain('/contact')
    expect(xml).not.toContain('<loc>https://wemeditate.com/null</loc>')
  })

  describe('the atlas half', () => {
    it('lists only atlas URLs this origin is the canonical home of', async () => {
      // Ownership is per-subtree: most regions canonicalize to the national site
      // that owns them, and listing those would ask a crawler to index URLs we
      // ourselves declare non-canonical.
      stubCollections({
        regions: [
          { id: 1, webUrl: 'https://wemeditate.com/map/gb/london', updatedAt: null },
          { id: 2, webUrl: 'https://sahaja.nl/kaart/nl/amsterdam', updatedAt: null },
        ],
        events: [
          { id: 1204, webUrl: 'https://wemeditate.com/map/gb/london/1204', updatedAt: null },
        ],
      })

      const xml = await (await get('/sitemap.xml')).text()

      expect(xml).toContain('<loc>https://wemeditate.com/map/gb/london</loc>')
      expect(xml).toContain('<loc>https://wemeditate.com/map/gb/london/1204</loc>')
      expect(xml).not.toContain('sahaja.nl')
    })
  })

  describe('degradation', () => {
    it('still serves the atlas half when the content reads fail', async () => {
      find.mockImplementation(async ({ collection }: { collection: string }) => {
        if (collection === 'regions' || collection === 'events') {
          return {
            docs: [{ id: 1, webUrl: 'https://wemeditate.com/map/gb', updatedAt: null }],
            hasNextPage: false,
          }
        }
        throw new Error('CMS unavailable')
      })

      const response = await get('/sitemap.xml')

      expect(response.status).toBe(200)
      await expect(response.text()).resolves.toContain('/map/gb')
    })

    it('still serves the content half when the atlas reads are refused', async () => {
      // Exactly what a client without the `sahaj-atlas-client` role gets.
      find.mockImplementation(async ({ collection }: { collection: string }) => {
        if (collection === 'regions' || collection === 'events') {
          throw new Error('403 Forbidden')
        }

        return { docs: [{ id: 1, slug: 'about', updatedAt: null }], hasNextPage: false }
      })

      const response = await get('/sitemap.xml')

      expect(response.status).toBe(200)
      await expect(response.text()).resolves.toContain('/about')
    })

    it('serves a well-formed empty sitemap on a preview, matching its robots.txt', async () => {
      const response = await get('/sitemap.xml', 'https://wemeditate-web-pr-62.workers.dev')
      const xml = await response.text()

      expect(response.status).toBe(200)
      expect(xml).toContain('</urlset>')
      expect(xml).not.toContain('<url>')
      // No point reading the CMS for a document we refuse to fill.
      expect(find).not.toHaveBeenCalled()
    })
  })
})
