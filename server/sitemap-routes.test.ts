import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import type { CmsEnv } from './cms-context'

const find = vi.fn()
const findGlobal = vi.fn()
// The atlas half is one custom-endpoint read, so it goes through `fetch`
// rather than the SDK client the content half uses.
const fetchMock = vi.fn()

vi.stubGlobal('fetch', fetchMock)

vi.mock('./cms-context', () => ({
  getCmsContext: () => ({ apiKey: 'test-key', baseURL: 'https://cms.test' }),
}))
vi.mock('@sentry/react', () => ({ captureMessage: vi.fn() }))
vi.mock('./payload-client', () => ({ createPayloadClient: () => ({ find, findGlobal }) }))
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

/** The `wm-web-config` global, which supplies the locale set and `/`'s page. */
function stubConfig(config: Record<string, unknown> = {}) {
  findGlobal.mockResolvedValue({
    availableLocales: ['en'],
    homePage: null,
    featuredPages: [],
    featuredArticles: [],
    classPages: [],
    knowledgePages: [],
    infoPages: [],
    ...config,
  })
}

/**
 * `GET /api/atlas/sitemap` — the client-scoped read behind the atlas half.
 *
 * Shape mirrored from SahajCloud's `src/endpoints/responseTypes.ts`. Every
 * `loc` is the document's own `webUrl`, so it arrives absolute and already
 * narrowed to the regions this API key's client owns.
 */
function stubAtlas(urls: { loc: string; lastmod?: string }[], status = 200) {
  fetchMock.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({
      generated: '2026-09-21T00:00:00.000Z',
      // Upstream drops any document without an `updatedAt`, so every row it
      // sends carries a `lastmod`. A null here would model a body the CMS
      // cannot produce.
      urls: urls.map((url, index) => ({
        lastmod: '2026-01-01T00:00:00.000Z',
        route: `/r${index}`,
        ...url,
      })),
    }),
  })
}

beforeEach(() => {
  retrySpy.mockClear()
  find.mockReset()
  findGlobal.mockReset()
  fetchMock.mockReset()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
  stubCollections({})
  stubConfig()
  stubAtlas([])
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

  it('retries every read behind it, since the KV layer used to supply that', async () => {
    await get('/sitemap.xml')

    // The config read, the content documents, and the atlas half. Each
    // degrades quietly (#98), so an unretried blip drops a whole section
    // from a response that still answers 200.
    expect(retrySpy).toHaveBeenCalledTimes(3)
    expect(retrySpy.mock.calls.every(([config]) => config === undefined)).toBe(true)
  })

  describe('hreflang alternates', () => {
    it('annotates a page with the locales it is published in', async () => {
      stubConfig({ availableLocales: ['en', 'fr', 'de'] })
      stubCollections({
        pages: [{ id: 1, slug: 'about', _status: { en: 'published', fr: 'published' } }],
      })

      const xml = await (await get('/sitemap.xml')).text()

      expect(xml).toContain('hreflang="en" href="https://wemeditate.com/about"')
      expect(xml).toContain('hreflang="fr" href="https://wemeditate.com/fr/about"')
      expect(xml).toContain('hreflang="x-default" href="https://wemeditate.com/about"')
    })

    it('omits a locale the page is not published in, though the site offers it', async () => {
      // The criterion the ticket's whole investigation was about: using
      // availableLocales here would declare a French translation that does
      // not exist, and Google drops the cluster.
      stubConfig({ availableLocales: ['en', 'fr', 'de'] })
      stubCollections({
        pages: [{ id: 1, slug: 'about', _status: { en: 'published', fr: 'draft' } }],
      })

      const xml = await (await get('/sitemap.xml')).text()

      expect(xml).not.toContain('/fr/about')
      expect(xml).not.toContain('/de/about')
    })

    it('reads the whole status map in the page list read, adding no query', async () => {
      stubConfig({ availableLocales: ['en', 'fr'] })
      stubCollections({ pages: [{ id: 1, slug: 'about', _status: { en: 'published' } }] })

      await (await get('/sitemap.xml')).text()

      // One read per content collection. The per-locale map rides along on
      // the pages read, `getSiteAnnotation` is a global read rather than a
      // find, and the atlas half is a single `fetch` to its own endpoint.
      const pageReads = find.mock.calls.filter(([args]) => args.collection === 'pages')

      expect(find).toHaveBeenCalledTimes(3)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(pageReads).toHaveLength(1)
      expect(pageReads[0][0]).toMatchObject({ locale: 'all' })
      // The one read this annotation adds, shared with every page render.
      expect(findGlobal).toHaveBeenCalledTimes(1)
    })

    it('annotates / with the home page document, not with the route', async () => {
      stubConfig({
        availableLocales: ['en', 'fr'],
        homePage: { id: 9, slug: 'home', title: 'Home' },
      })
      stubCollections({
        pages: [{ id: 9, slug: 'home', _status: { en: 'published', fr: 'published' } }],
      })

      const xml = await (await get('/sitemap.xml')).text()

      expect(xml).toContain(
        '<url><loc>https://wemeditate.com/</loc><xhtml:link rel="alternate" hreflang="en" href="https://wemeditate.com/"/><xhtml:link rel="alternate" hreflang="fr" href="https://wemeditate.com/fr"/>',
      )
    })

    it('lists the home document once, as /, and not again at its own slug', async () => {
      // `pages/[slug]/+route.ts` serves `/home` too. Listing both offers a
      // crawler two self-canonical URLs for one document, each with its own
      // cluster — the duplicate-content shape this annotation avoids.
      stubConfig({
        availableLocales: ['en', 'fr'],
        homePage: { id: 9, slug: 'home', title: 'Home' },
      })
      stubCollections({
        pages: [
          {
            id: 9,
            slug: 'home',
            updatedAt: '2026-08-03T00:00:00.000Z',
            _status: { en: 'published', fr: 'published' },
          },
          { id: 1, slug: 'about', _status: { en: 'published' } },
        ],
      })

      const xml = await (await get('/sitemap.xml')).text()

      expect(xml).not.toContain('<loc>https://wemeditate.com/home</loc>')
      expect(xml).toContain('<loc>https://wemeditate.com/about</loc>')
      // `/` carries the document's own lastmod, which the read already held.
      expect(xml).toContain(
        '<url><loc>https://wemeditate.com/</loc><lastmod>2026-08-03T00:00:00.000Z</lastmod>',
      )
    })

    it('leaves meditations and lectures unannotated', async () => {
      // Neither collection opts into per-locale publish state upstream, so
      // neither has a per-document translation claim to make.
      stubConfig({ availableLocales: ['en', 'fr'] })
      stubCollections({
        meditations: [{ id: 142, updatedAt: null }],
        lectures: [{ id: 163, updatedAt: null }],
      })

      const xml = await (await get('/sitemap.xml')).text()

      expect(xml).toContain('<url><loc>https://wemeditate.com/meditations/142</loc></url>')
      expect(xml).toContain('<url><loc>https://wemeditate.com/lectures/163</loc></url>')
    })

    it('still lists the home page when the config read fails', async () => {
      findGlobal.mockRejectedValue(new Error('CMS unavailable'))
      stubCollections({ pages: [{ id: 1, slug: 'about', _status: { en: 'published' } }] })

      const xml = await (await get('/sitemap.xml')).text()

      expect(xml).toContain('<loc>https://wemeditate.com/</loc>')
      expect(xml).toContain('<loc>https://wemeditate.com/about</loc>')
    })

    it('still lists the home page when the content reads fail', async () => {
      find.mockRejectedValue(new Error('CMS unavailable'))

      const xml = await (await get('/sitemap.xml')).text()

      expect(xml).toContain('<url><loc>https://wemeditate.com/</loc></url>')
    })
  })

  describe('the atlas half', () => {
    it('lists only atlas URLs this origin is the canonical home of', async () => {
      // Ownership is per-subtree, and resolved upstream. The off-origin row
      // is the guard's case: a key whose client canonicalizes elsewhere
      // must not publish that site's URLs here.
      stubAtlas([
        { loc: 'https://wemeditate.com/map/gb/london' },
        { loc: 'https://sahaja.nl/kaart/nl/amsterdam' },
        { loc: 'https://wemeditate.com/map/gb/london/1204' },
      ])

      const xml = await (await get('/sitemap.xml')).text()

      expect(xml).toContain('<loc>https://wemeditate.com/map/gb/london</loc>')
      expect(xml).toContain('<loc>https://wemeditate.com/map/gb/london/1204</loc>')
      expect(xml).not.toContain('sahaja.nl')
    })

    it('carries an atlas corpus past the ceiling the collection reads had', async () => {
      // 500 × 4 per collection used to cap this before the origin filter
      // even ran, so atlas growth anywhere truncated the sitemap (#123).
      stubAtlas(
        Array.from({ length: 2_500 }, (_, index) => ({
          loc: `https://wemeditate.com/map/gb/london/${index}`,
        })),
      )

      const xml = await (await get('/sitemap.xml')).text()

      expect(xml).toContain('<loc>https://wemeditate.com/map/gb/london/2499</loc>')
    })
  })

  describe('degradation', () => {
    it('still serves the atlas half when the content reads fail', async () => {
      find.mockRejectedValue(new Error('CMS unavailable'))
      stubAtlas([{ loc: 'https://wemeditate.com/map/gb' }])

      const response = await get('/sitemap.xml')

      expect(response.status).toBe(200)
      await expect(response.text()).resolves.toContain('/map/gb')
    })

    it('still serves the content half when the atlas read is refused', async () => {
      // Exactly what a client without the `sahaj-atlas-client` role gets.
      stubAtlas([], 403)
      stubCollections({ pages: [{ id: 1, slug: 'about', updatedAt: null }] })

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
      // No need to read the CMS for a document this response will not fill.
      expect(find).not.toHaveBeenCalled()
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })
})
