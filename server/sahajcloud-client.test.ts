import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  getDocumentById,
  getMeditationSongs,
  getPageBySlug,
  getPageLocaleStatus,
  getWebConfig,
  partitionPublishedPages,
  getRelatedMeditations,
  getRelatedLectures,
} from './sahajcloud-client'
import { createPayloadClient } from './payload-client'
import * as Sentry from '@sentry/cloudflare'
import { detectErrorType, ErrorType } from './error-utils'
import { MeditationTemplate } from '../components/templates/MeditationTemplate'
import type { Locale, Meditation, Page, PageStatus } from './sahajcloud-types'

// Stub the SDK factory to capture the query.
vi.mock('./payload-client', () => ({
  createPayloadClient: vi.fn(),
}))
// The shaped nested-route fetchers (related-*) read apiKey and baseURL from context.
vi.mock('./sahajcloud-context', () => ({
  getSahajCloudContext: () => ({ apiKey: 'test-key', baseURL: 'https://sahajcloud.test' }),
}))
// Silence the Sentry warning emitted on unresolved page references, and keep
// its calls countable: the warning is rate-limited per isolate.
vi.mock('@sentry/cloudflare', () => ({ captureMessage: vi.fn() }))
/** Each `frames` prop the stubbed player was handed, in render order. */
const { playerFrames } = vi.hoisted(() => ({ playerFrames: [] as unknown[] }))

// The keyframe narrowing is a contract with MeditationTemplate, and the
// server render shows one keyframe, so markup cannot compare the rest. The
// `frames` prop the template builds from all of them can.
vi.mock('../components/organisms/MeditationPlayer', () => ({
  MeditationPlayer: ({ frames }: { frames: unknown }) => {
    playerFrames.push(frames)

    return null
  },
}))
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

  // sahajCloudFetch clones a non-OK response to dump the SahajCloud error body.
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
      7, // unpublished page: SahajCloud returns a bare id instead of a populated object
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

  it('populates a config page with exactly the fields `NavPage` promises', async () => {
    const findGlobal = vi.fn().mockResolvedValue({ id: 1 })

    vi.mocked(createPayloadClient).mockReturnValue({ findGlobal } as never)

    await getWebConfig({ locale: 'en' })

    // The config is serialised into every page's HTML, so a key added here is
    // paid for on every render. `NavPage` is what the consumers may read, and
    // this is the read that makes it true.
    const { pages } = findGlobal.mock.calls[0][0].populate

    expect(Object.keys(pages).sort()).toEqual(['meta', 'slug', 'title'])
    expect(Object.keys(pages.meta).sort()).toEqual(['image', 'title'])
  })
})

describe('getWebConfig unresolved-reference reporting', () => {
  /** A config whose `featuredArticles` holds one unpublished (bare-id) page. */
  function configWithGap(badId: number) {
    const findGlobal = vi.fn().mockResolvedValue({ id: 1, featuredArticles: [badId] })

    vi.mocked(createPayloadClient).mockReturnValue({ findGlobal } as never)
  }

  it('sends one event per distinct gap, not one per render', async () => {
    resetReadState()
    vi.mocked(Sentry.captureMessage).mockClear()
    configWithGap(9001)

    await getWebConfig({ locale: 'en' })
    await getWebConfig({ locale: 'en' })
    await getWebConfig({ locale: 'fr' })

    // The read runs per render, and the gap stands until an editor publishes
    // the page. Per-render events would spend the Sentry quota on one data gap.
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1)
  })

  it('still warns on every render, so the request log keeps the full record', async () => {
    resetReadState()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    configWithGap(9002)

    await getWebConfig({ locale: 'en' })
    await getWebConfig({ locale: 'en' })

    expect(warn).toHaveBeenCalledTimes(2)
  })

  it('reports a gap it has not seen before', async () => {
    resetReadState()
    vi.mocked(Sentry.captureMessage).mockClear()

    configWithGap(9003)
    await getWebConfig({ locale: 'en' })

    configWithGap(9004)
    await getWebConfig({ locale: 'en' })

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(2)
  })
})

describe('getWebConfig homePage', () => {
  it('is null when the home page is unpublished, so `/` 404s instead of rendering blank', async () => {
    const findGlobal = vi.fn().mockResolvedValue({ id: 1, homePage: 7 })

    vi.mocked(createPayloadClient).mockReturnValue({ findGlobal } as never)

    expect((await getWebConfig({ locale: 'en' })).homePage).toBeNull()
  })
})

describe('getDocumentById', () => {
  beforeEach(resetReadState)

  it('returns null for an unknown id, so a stale link 404s instead of 500ing', async () => {
    const notFound = Object.assign(new Error('The requested resource was not found.'), {
      status: 404,
    })
    const findByID = vi.fn().mockRejectedValue(notFound)

    vi.mocked(createPayloadClient).mockReturnValue({ findByID } as never)

    await expect(
      getDocumentById({ collection: 'meditations', id: '999999', locale: 'en' }),
    ).resolves.toBeNull()
  })

  it('still propagates a 500, so a broken backend is not read as a missing document', async () => {
    const serverError = Object.assign(new Error('Internal Server Error'), { status: 500 })
    const findByID = vi.fn().mockRejectedValue(serverError)

    vi.mocked(createPayloadClient).mockReturnValue({ findByID } as never)

    await expect(
      getDocumentById({ collection: 'meditations', id: '12', locale: 'en' }),
    ).rejects.toBe(serverError)
  })
})

/**
 * The keyframes are SahajCloud's answer for meditations 17 and 130, trimmed:
 * every key a keyframe arrives with is kept, because the narrowing is about
 * exactly those keys, and so is the chakra keyframe's populated `page`.
 */
const READY_FRAME = {
  id: 12,
  timestamp: 0,
  imageSet: 'female',
  subtleSystemNode: null,
  label: 'Ready, palms open',
  tags: ['ready'],
  duration: null,
  fileMetadata: { originalFilename: 'meditate_ready_girl_processed.webp' },
  prefix: '',
  _objectKey: null,
  updatedAt: '2026-10-13T09:05:56.025Z',
  createdAt: '2026-01-22T10:44:00.517Z',
  thumbnailURL: null,
  filename: '564068d6-af28-4103-19cf-8808975f7e00',
  mimeType: 'image/webp',
  filesize: 38266,
  width: 900,
  height: 900,
  focalX: 50,
  focalY: 50,
  hlsUrl: null,
  mp4Url: null,
  previewUrl:
    'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/564068d6-af28-4103-19cf-8808975f7e00/format=auto,width=320,height=320,fit=cover',
  url: 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/564068d6-af28-4103-19cf-8808975f7e00/public',
}

const CHAKRA_FRAME = {
  id: 48,
  timestamp: 114,
  imageSet: 'female',
  subtleSystemNode: {
    id: 8,
    slug: 'sahasrara',
    page: {
      id: 59,
      title: 'Sahasrara Chakra',
      content: {
        root: {
          type: 'root',
          children: [
            {
              type: 'upload',
              value: 283,
              fields: { align: 'center' },
              version: 1,
              relationTo: 'images',
            },
          ],
        },
      },
      meta: { title: null, description: null, image: null },
      generateSlug: false,
      slug: 'sahasrara-chakra',
      author: null,
      featuredVideo: null,
      tags: [],
      managers: [],
      updatedAt: '2026-05-22T18:20:42.739Z',
      createdAt: '2026-01-23T09:21:28.194Z',
      _status: 'published',
      webPath: 'sahasrara-chakra',
      webUrl: 'https://wemeditate.com/sahasrara-chakra',
    },
    lectures: { docs: [], hasNextPage: false },
    frames: { docs: [81, 80, 79, 78, 50, 49, 48, 47], hasNextPage: false },
    updatedAt: '2026-06-08T04:40:44.649Z',
    createdAt: '2026-04-28T12:13:36.856Z',
  },
  label: null,
  tags: ['hand', 'massage'],
  duration: null,
  fileMetadata: { originalFilename: 'sahasrara.webp' },
  prefix: '',
  _objectKey: null,
  updatedAt: '2026-01-22T10:46:48.530Z',
  createdAt: '2026-01-22T10:46:48.530Z',
  thumbnailURL: null,
  filename: 'f945928e-4574-4ed9-a7f3-bb40d91aec00',
  mimeType: 'image/webp',
  filesize: 537462,
  width: 1500,
  height: 1500,
  focalX: 50,
  focalY: 50,
  hlsUrl: null,
  mp4Url: null,
  previewUrl:
    'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/f945928e-4574-4ed9-a7f3-bb40d91aec00/format=auto,width=320,height=320,fit=cover',
  url: 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/f945928e-4574-4ed9-a7f3-bb40d91aec00/public',
}

/** Meditation 130's one video keyframe, given a duration to carry through. */
const VIDEO_FRAME = {
  id: 79,
  timestamp: 641,
  imageSet: 'female',
  subtleSystemNode: null,
  label: null,
  tags: ['massage'],
  duration: 14,
  fileMetadata: { originalFilename: '079-sahasrara-massage-lakshmi.mp4' },
  prefix: '',
  _objectKey: null,
  updatedAt: '2026-10-13T13:22:30.623Z',
  createdAt: '2026-01-22T13:00:26.894Z',
  thumbnailURL:
    'https://customer-aorobtik2fce41s5.cloudflarestream.com/8990dc42cc2e50229f37b612f5fc85f7/thumbnails/thumbnail.jpg?height=320',
  filename: '8990dc42cc2e50229f37b612f5fc85f7',
  mimeType: 'video/mp4',
  filesize: 3964026,
  width: null,
  height: null,
  focalX: null,
  focalY: null,
  hlsUrl:
    'https://customer-aorobtik2fce41s5.cloudflarestream.com/8990dc42cc2e50229f37b612f5fc85f7/manifest/video.m3u8',
  mp4Url:
    'https://customer-aorobtik2fce41s5.cloudflarestream.com/8990dc42cc2e50229f37b612f5fc85f7/downloads/default.mp4',
  previewUrl:
    'https://customer-aorobtik2fce41s5.cloudflarestream.com/8990dc42cc2e50229f37b612f5fc85f7/thumbnails/thumbnail.jpg?height=320',
  url: 'https://customer-aorobtik2fce41s5.cloudflarestream.com/8990dc42cc2e50229f37b612f5fc85f7/manifest/video.m3u8',
}

function meditationAsRead(frames: unknown = [READY_FRAME, CHAKRA_FRAME, VIDEO_FRAME]): Meditation {
  return {
    id: 17,
    duration: 629,
    subtleSystemNodeWeights: { pingala: 169, sahasrara: 159 },
    thumbnail: {
      id: 49,
      alt: 'Meditation placeholder image',
      filename: '5d20f294-c449-451d-c5f4-542c2ae1f600',
      width: 1471,
      height: 900,
      url: 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/5d20f294-c449-451d-c5f4-542c2ae1f600/public',
    },
    frames,
    _status: 'published',
    filename: 'calm10-kg6di3xa7q.mp3',
    durationMinutes: 11,
    title: 'Meditation for Right Channel',
    url: 'https://assets.sydevelopers.com/calm10-kg6di3xa7q.mp3',
  } as unknown as Meditation
}

/** Reads meditation 17 through the SDK stub, with `frames` as given. */
async function readMeditation(frames?: unknown): Promise<Meditation> {
  const findByID = vi.fn().mockResolvedValue(meditationAsRead(frames))

  vi.mocked(createPayloadClient).mockReturnValue({ findByID } as never)

  const result = await getDocumentById({ collection: 'meditations', id: '17', locale: 'en' })

  if (!result) throw new Error('expected the read to answer a meditation')

  return result
}

describe('meditation keyframes', () => {
  beforeEach(() => {
    resetReadState()
    playerFrames.length = 0
  })

  it('ships each keyframe with only the fields the player reads', async () => {
    const meditation = await readMeditation()

    expect(meditation.frames).toEqual([
      { id: 12, timestamp: 0, url: READY_FRAME.url, mimeType: 'image/webp', duration: null },
      { id: 48, timestamp: 114, url: CHAKRA_FRAME.url, mimeType: 'image/webp', duration: null },
      { id: 79, timestamp: 641, url: VIDEO_FRAME.url, mimeType: 'video/mp4', duration: 14 },
    ])
    // The page document a chakra keyframe drags in is what this is for.
    expect(JSON.stringify(meditation)).not.toContain('sahasrara-chakra')
  })

  it('keeps every field of the meditation itself, which the player and the head read', async () => {
    const meditation = await readMeditation()

    expect({ ...meditation, frames: null }).toEqual({ ...meditationAsRead(), frames: null })
  })

  it('leaves a meditation with no keyframes as it came, for the thumbnail fallback', async () => {
    expect((await readMeditation(null)).frames).toBeNull()
  })

  it('hands the player the same keyframes as the whole document would', async () => {
    const meditation = await readMeditation()

    // No Embed button: it is browser-only, and needs a Vike app to render.
    for (const document of [meditationAsRead(), meditation]) {
      renderToStaticMarkup(
        createElement(MeditationTemplate, { meditation: document, showEmbedButton: false }),
      )
    }

    const [fromWhole, fromNarrowed] = playerFrames

    expect(fromWhole).toHaveLength(3)
    expect(fromWhole).toContainEqual(
      expect.objectContaining({
        timestamp: 641,
        media: expect.objectContaining({ type: 'video', duration: 14 }),
      }),
    )
    expect(fromNarrowed).toEqual(fromWhole)
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
    const find = vi.fn().mockRejectedValue(new Error('SahajCloud unavailable'))

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

  it('retries a public read, so a transient SahajCloud fault never reaches a visitor', async () => {
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
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://sahajcloud.test/api/meditations/77/songs?locale=en',
    )
  })

  it('degrades to voice-only on an unknown meditation id (404)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fetchResponse(404, {})))

    expect(await getMeditationSongs({ id: '999999', locale: 'en' })).toEqual([])
  })
})

describe('every custom-endpoint read', () => {
  beforeEach(resetReadState)

  it.each([
    ['getMeditationSongs', () => getMeditationSongs({ id: '77', locale: 'en' })],
    ['getRelatedMeditations', () => getRelatedMeditations({ id: '163', locale: 'en' })],
    ['getRelatedLectures', () => getRelatedLectures({ id: '142', locale: 'en', audiences: [1] })],
  ])('hands %s a 522 the retry ladder classifies as SERVER, not UNKNOWN', async (_label, read) => {
    // `detectErrorType` falls back to matching `50[0-9]` in the message, which
    // a Cloudflare-origin 5xx never contains. Only the status on the error
    // keeps it retryable.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fetchResponse(522, {})))

    await read()

    expect(detectErrorType(retried.error)).toBe(ErrorType.SERVER)
  })
})
