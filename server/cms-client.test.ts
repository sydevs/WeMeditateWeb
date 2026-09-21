import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getMeditationSongs,
  getPageBySlug,
  getPageLocaleStatus,
  getWebConfig,
  partitionPublishedPages,
  getRelatedMeditations,
  getRelatedLectures,
} from './cms-client'
import { createPayloadClient } from './payload-client'
import { detectErrorType, ErrorType } from './error-utils'
import type { Locale, Page, PageStatus } from './cms-types'

// Stub the SDK factory to capture the query.
vi.mock('./payload-client', () => ({
  createPayloadClient: vi.fn(),
}))
// The shaped nested-route fetchers (related-*) read apiKey and baseURL from context.
vi.mock('./cms-context', () => ({
  getCmsContext: () => ({ apiKey: 'test-key', baseURL: 'https://cms.test' }),
}))
// Silence the Sentry warning emitted on unresolved page references.
vi.mock('@sentry/react', () => ({ captureMessage: vi.fn() }))
// The stub runs the read once, so no test waits on real backoff.
// `retrySpy` keeps the config visible to the tests that assert one, and
// `retried.error` the error the ladder was handed, which is what decides
// whether a real withRetry would try again.
// error-utils.test.ts covers what withRetry itself does.
const { retrySpy, retried } = vi.hoisted(() => ({
  retrySpy: vi.fn(),
  retried: { error: undefined as unknown },
}))

vi.mock('./error-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./error-utils')>()

  return {
    ...actual,
    withRetry: async (fn: () => unknown, config?: unknown) => {
      retrySpy(config)

      try {
        return await fn()
      } catch (error) {
        retried.error = error
        throw error
      }
    },
  }
})

/** Builds a fetch Response stub for the given status and JSON body. */
function fetchResponse(status: number, body: unknown) {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    json: async () => body,
  }

  // cmsFetch clones a non-OK response to dump the CMS error body.
  return { ...response, clone: () => response }
}

/** Silences the request log and error dump, and forgets the previous read's error. */
function resetReadState() {
  retried.error = undefined
  vi.restoreAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
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

describe('getPageLocaleStatus', () => {
  it('asks for the per-locale status map in one locale-agnostic read', async () => {
    const status = { en: 'published', fr: 'published', de: 'draft' }
    const find = vi.fn().mockResolvedValue({ docs: [{ id: 1, _status: status }] })

    vi.mocked(createPayloadClient).mockReturnValue({ find } as never)

    const result = await getPageLocaleStatus({ slug: 'about' })
    const args = find.mock.calls[0][0]

    // One read, not one per locale: `all` returns every locale's status in
    // a single query, and nothing but `_status` comes back.
    expect(find).toHaveBeenCalledTimes(1)
    expect(args).toMatchObject({ collection: 'pages', locale: 'all', depth: 0, limit: 1 })
    expect(args.select).toEqual({ _status: true })
    expect(result).toEqual(status)

    // The signature, not only the value. A `Promise<unknown>` here pushed
    // the shape check downstream, into a caller that already had to guard
    // a generated document type for a different reason. `tsc` fails this
    // line if the return type loosens again.
    const typed: Partial<Record<Locale, PageStatus>> = result

    expect(typed.en).toBe('published')
  })

  it('degrades to an empty map rather than failing the page', async () => {
    const find = vi.fn().mockRejectedValue(new Error('CMS unavailable'))

    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(createPayloadClient).mockReturnValue({ find } as never)

    await expect(getPageLocaleStatus({ slug: 'about' })).resolves.toEqual({})
  })

  it('returns an empty map, never null, for a missing page', async () => {
    // `advertisedLocales` walks the map either way, so the caller never has
    // to distinguish "no page" from "no per-locale status".
    const find = vi.fn().mockResolvedValue({ docs: [] })

    vi.mocked(createPayloadClient).mockReturnValue({ find } as never)

    await expect(getPageLocaleStatus({ slug: 'gone' })).resolves.toEqual({})
  })

  it('tries once, instead of retrying for seconds to decorate the head', async () => {
    // The default is 3 attempts with 1s and 2s backoff. The page content is
    // already in hand when this read fails, so retrying would stall TTFB
    // for an annotation the page renders fine without.
    const find = vi.fn().mockResolvedValue({ docs: [] })

    retrySpy.mockClear()
    vi.mocked(createPayloadClient).mockReturnValue({ find } as never)

    await getPageLocaleStatus({ slug: 'about' })

    expect(retrySpy.mock.calls[0][0]).toMatchObject({ maxAttempts: 1 })
  })
})

describe('retry policy', () => {
  beforeEach(() => {
    retrySpy.mockClear()
    vi.mocked(createPayloadClient).mockReturnValue({
      find: vi.fn().mockResolvedValue({ docs: [{ id: 1, slug: 'about', _status: 'published' }] }),
    } as never)
  })

  it('retries a public read, so a transient CMS fault does not reach the visitor', async () => {
    // The KV layer this read used to sit behind supplied the retry (#98).
    // Dropping the cache must not drop the resilience with it.
    await getPageBySlug({ slug: 'about', locale: 'en' })

    expect(retrySpy).toHaveBeenCalledTimes(1)
  })

  it('does not retry a preview read', async () => {
    // An editor watching their own edit needs the error now, not after
    // about 7s of backoff.
    await getPageBySlug({ slug: 'about', locale: 'en', preview: true, previewToken: 't' })

    expect(retrySpy).not.toHaveBeenCalled()
  })
})

describe('getRelatedMeditations', () => {
  beforeEach(resetReadState)

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

  it('throws a 522 the retry ladder classifies as SERVER, not UNKNOWN', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fetchResponse(522, {})))

    await getRelatedMeditations({ id: '163', locale: 'en' })

    expect(detectErrorType(retried.error)).toBe(ErrorType.SERVER)
  })
})

describe('getRelatedLectures', () => {
  beforeEach(resetReadState)

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

  it('throws a 522 the retry ladder classifies as SERVER, not UNKNOWN', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fetchResponse(522, {})))

    await getRelatedLectures({ id: '142', locale: 'en', audiences: [1] })

    expect(detectErrorType(retried.error)).toBe(ErrorType.SERVER)
  })
})

describe('getMeditationSongs', () => {
  beforeEach(resetReadState)

  it('asks the songs route for the locale and keeps only playable tracks', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      fetchResponse(200, {
        docs: [
          { id: 9, title: 'Raga', url: 'https://cdn/a.mp3' },
          { id: 10, title: 'No file', url: '' },
        ],
      }),
    )

    vi.stubGlobal('fetch', fetchMock)

    expect(await getMeditationSongs({ id: '77', locale: 'en' })).toEqual([
      { id: 9, title: 'Raga', url: 'https://cdn/a.mp3' },
    ])
    expect(fetchMock.mock.calls[0][0]).toBe('https://cms.test/api/meditations/77/songs?locale=en')
  })

  it('degrades to voice-only on an unknown meditation id (404)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fetchResponse(404, {})))

    expect(await getMeditationSongs({ id: '999999', locale: 'en' })).toEqual([])
  })

  it('throws a 522 the retry ladder classifies as SERVER, not UNKNOWN', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fetchResponse(522, {})))

    await getMeditationSongs({ id: '77', locale: 'en' })

    expect(detectErrorType(retried.error)).toBe(ErrorType.SERVER)
  })
})
