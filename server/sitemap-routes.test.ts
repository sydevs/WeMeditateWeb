import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import type { CmsEnv } from './cms-context'

const find = vi.fn()
const findGlobal = vi.fn()

vi.mock('./cms-context', () => ({
  getCmsContext: () => ({ apiKey: 'test-key', baseURL: 'https://cms.test', kv: undefined }),
}))
vi.mock('@sentry/react', () => ({ captureMessage: vi.fn() }))
vi.mock('./payload-client', () => ({ createPayloadClient: () => ({ find, findGlobal }) }))
/** Every key this route asks the cache for, in call order. */
const { cacheKeys } = vi.hoisted(() => ({ cacheKeys: [] as string[] }))

vi.mock('./kv-cache', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./kv-cache')>()

  return {
    ...actual,
    withCache: (opts: { cacheKey: string; fetchFn: () => unknown }) => {
      cacheKeys.push(opts.cacheKey)

      return opts.fetchFn()
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

beforeEach(() => {
  cacheKeys.length = 0
  find.mockReset()
  findGlobal.mockReset()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  stubCollections({})
  stubConfig()
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

  it('caches the documents under a prefix of their own, not the old URL list one', async () => {
    await get('/sitemap.xml')

    // This entry holds `{ pages, meditations, lectures }`. The
    // `content-sitemap` prefix holds the `SitemapUrl[]` this route cached
    // before the alternates work, and `getCachedResponse` returns stored
    // JSON without a shape check. Reading one as the other drops every
    // content URL from the sitemap for a whole TTL after the deploy.
    expect(cacheKeys).toContain('content-sitemap-docs:origin=https://wemeditate.com')
    expect(cacheKeys).not.toContain('content-sitemap:origin=https://wemeditate.com')
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

      // One read per collection — three content, two atlas — exactly as
      // before this annotation. The per-locale map rides along on the pages
      // read, and `getSiteAnnotation` is a global read, not a find.
      const pageReads = find.mock.calls.filter(([args]) => args.collection === 'pages')

      expect(find).toHaveBeenCalledTimes(5)
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
      // Ownership is per-subtree. Most regions canonicalize to the
      // national site that owns them. Listing those would ask a crawler to
      // index URLs this site itself marks non-canonical.
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
      // No need to read the CMS for a document this response will not fill.
      expect(find).not.toHaveBeenCalled()
    })
  })
})
