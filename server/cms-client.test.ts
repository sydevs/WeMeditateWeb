import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getPageBySlug,
  getWebConfig,
  partitionPublishedPages,
  getRelatedMeditations,
  getRelatedLectures,
} from './cms-client'
import { createPayloadClient } from './payload-client'
import type { Page } from './cms-types'

// Stub the SDK factory to capture the query. Stub the cache so the
// fetch function runs synchronously, without KV.
vi.mock('./payload-client', () => ({
  createPayloadClient: vi.fn(),
  validateSDKResponse: (value: unknown) => value,
}))
// The shaped nested-route fetchers (related-*) read apiKey and baseURL from context.
vi.mock('./cms-context', () => ({
  getCmsContext: () => ({ apiKey: 'test-key', baseURL: 'https://cms.test', kv: undefined }),
}))
// Silence the Sentry warning emitted on unresolved page references.
vi.mock('@sentry/react', () => ({ captureMessage: vi.fn() }))
vi.mock('./kv-cache', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./kv-cache')>()

  return { ...actual, withCache: (opts: { fetchFn: () => unknown }) => opts.fetchFn() }
})

/** Builds a fetch Response stub for the given status and JSON body. */
function fetchResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

const page = (id: number, slug: string): Page => ({ id, slug, title: 'T' }) as unknown as Page

describe('partitionPublishedPages', () => {
  it('keeps published pages with a slug; flags bare IDs (unpublished) and slugless objects', () => {
    const { published, unresolved } = partitionPublishedPages([
      page(10, 'meditate-now'),
      7, // unpublished page: the CMS returns a bare id instead of a populated object
      page(99, ''), // populated but no slug: cannot form a link
    ])

    expect(published.map((p) => p.slug)).toEqual(['meditate-now'])
    expect(unresolved).toEqual(['id:7', 'id:99(no-slug)'])
  })

  it('treats null/undefined as empty', () => {
    expect(partitionPublishedPages(null)).toEqual({ published: [], unresolved: [] })
    expect(partitionPublishedPages(undefined)).toEqual({ published: [], unresolved: [] })
  })

  it('keeps every page when all are published', () => {
    const { published, unresolved } = partitionPublishedPages([page(1, 'a'), page(2, 'b')])

    expect(published).toHaveLength(2)
    expect(unresolved).toEqual([])
  })
})

describe('getWebConfig featuredArticles', () => {
  it('selects featuredArticles and drops unpublished (bare-id) refs', async () => {
    const findGlobal = vi.fn().mockResolvedValue({
      id: 1,
      homePage: page(1, 'home'),
      featuredPages: [page(2, 'about')],
      // One published article, and one unpublished page (returned as a bare id).
      featuredArticles: [page(3, 'history-of-meditation'), 42],
      classPages: [],
      knowledgePages: [page(4, 'kundalini')],
      infoPages: [],
    })

    vi.mocked(createPayloadClient).mockReturnValue({ findGlobal } as never)

    const config = await getWebConfig({ locale: 'en' })
    const args = findGlobal.mock.calls[0][0]

    // The read must request featuredArticles (per server/AGENTS.md).
    expect(args.select.featuredArticles).toBe(true)
    // The bare-id (unpublished) ref is dropped. Only linkable articles remain.
    expect(config.featuredArticles.map((p) => p.slug)).toEqual(['history-of-meditation'])
  })
})

describe('getPageBySlug query shape', () => {
  it('reads at depth 3 with narrow per-collection populate for embedded relations', async () => {
    const find = vi.fn().mockResolvedValue({
      docs: [{ id: 1, slug: 'chakras-channels', _status: 'published' }],
    })

    vi.mocked(createPayloadClient).mockReturnValue({ find } as never)

    await getPageBySlug({ slug: 'chakras-channels', locale: 'en' })

    const args = find.mock.calls[0][0]

    expect(args.collection).toBe('pages')
    expect(args.depth).toBe(3)
    // Embedded content relationships are populated narrowly.
    expect(Object.keys(args.populate)).toEqual(
      expect.arrayContaining(['pages', 'meditations', 'lectures', 'albums', 'app-cards', 'images']),
    )
    // The embedded page select also omits the heavy `content` field.
    expect(args.populate.pages.slug).toBe(true)
    expect(args.populate.pages.content).toBeUndefined()
  })
})

describe('getRelatedMeditations', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('maps shaped docs to cards and requests locale + limit on the lecture route', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      fetchResponse(200, {
        docs: [
          {
            id: 141,
            title: 'Meditation for Vishuddhi',
            durationMinutes: 19,
            thumbnailUrl: 'https://imagedelivery.net/acct/abc/public',
            narratorName: 'Sidd',
          },
        ],
        source: 'fallback',
        relevanceCount: 0,
      }),
    )

    vi.stubGlobal('fetch', fetchMock)

    const cards = await getRelatedMeditations({ id: '163', locale: 'en', limit: 6 })

    expect(cards).toEqual([
      {
        id: 141,
        title: 'Meditation for Vishuddhi',
        durationMinutes: 19,
        thumbnailUrl: 'https://imagedelivery.net/acct/abc/public',
        narratorName: 'Sidd',
      },
    ])
    const url = fetchMock.mock.calls[0][0] as string

    expect(url).toContain('/api/lectures/163/related-meditations')
    expect(url).toContain('locale=en')
    expect(url).toContain('limit=6')
  })

  it('drops docs missing a public title or thumbnail (no blank cards / broken images)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        fetchResponse(200, {
          docs: [
            { id: 1, title: '', durationMinutes: 10, thumbnailUrl: 'https://x/y/public' },
            { id: 2, title: 'Ok', durationMinutes: 10, thumbnailUrl: '' },
            { id: 3, title: 'Good', durationMinutes: 12, thumbnailUrl: 'https://x/z/public' },
          ],
        }),
      ),
    )

    const cards = await getRelatedMeditations({ id: '163', locale: 'en' })

    expect(cards.map((c) => c.id)).toEqual([3])
    // narratorName is optional in the payload. It defaults to '', so the card type holds.
    expect(cards[0].narratorName).toBe('')
  })

  it('degrades to [] on an unknown lecture id (404)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fetchResponse(404, {})))

    expect(await getRelatedMeditations({ id: '999999', locale: 'en' })).toEqual([])
  })

  it('degrades to [] (never throws) on a server error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fetchResponse(500, {})))

    expect(await getRelatedMeditations({ id: '163', locale: 'en' })).toEqual([])
  })
})

describe('getRelatedLectures', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('short-circuits to [] without a request when no audiences are configured', async () => {
    const fetchMock = vi.fn()

    vi.stubGlobal('fetch', fetchMock)

    expect(await getRelatedLectures({ id: '142', locale: 'en', audiences: [] })).toEqual([])
    // Defensive. The field is typed required, but before config it can be
    // nullish at runtime (the deploy ships an empty audience set). Guard
    // against it anyway.
    expect(
      await getRelatedLectures({
        id: '142',
        locale: 'en',
        audiences: null as unknown as [],
      }),
    ).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends audiences (bare ids + populated objects) and maps duration seconds', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      fetchResponse(200, {
        docs: [
          {
            id: 150,
            title: 'Truth Has to Be Experienced',
            duration: 952,
            thumbnailUrl: 'https://img.youtube.com/vi/abc/mqdefault.jpg',
            hlsUrl: 'https://player.vimeo.com/external/1.m3u8',
          },
        ],
        source: 'audience-fallback',
      }),
    )

    vi.stubGlobal('fetch', fetchMock)

    const cards = await getRelatedLectures({
      id: '142',
      locale: 'en',
      // Mixed bare id and populated audience object: both ids sent.
      audiences: [1, { id: 6 } as never],
      limit: 6,
    })

    expect(cards).toEqual([
      {
        id: 150,
        title: 'Truth Has to Be Experienced',
        durationSeconds: 952,
        thumbnailUrl: 'https://img.youtube.com/vi/abc/mqdefault.jpg',
      },
    ])
    const url = fetchMock.mock.calls[0][0] as string

    expect(url).toContain('/api/meditations/142/related-lectures')
    expect(url).toContain('audiences=1,6')
    expect(url).toContain('limit=6')
  })

  it('degrades to [] on a server error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fetchResponse(500, {})))

    expect(await getRelatedLectures({ id: '142', locale: 'en', audiences: [1] })).toEqual([])
  })
})
