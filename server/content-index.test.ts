import { describe, it, expect, vi, beforeEach } from 'vitest'

// Provide SahajCloud config without a request context, and silence Sentry
// warnings on the degrade paths.
vi.mock('./sahajcloud/context', () => ({
  getSahajCloudContext: () => ({ apiKey: 'test-key', baseURL: 'https://sahajcloud.test' }),
}))
vi.mock('@sentry/cloudflare', () => ({
  captureMessage: vi.fn(),
  // `withRetry` breadcrumbs each retried attempt and captures the last
  // failure. A mock without them throws inside its own catch, which reads
  // as a read that never retried.
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
}))

import * as Sentry from '@sentry/cloudflare'
import {
  resolveContentIndexItems,
  resolveContentIndexTracks,
  resolveContentIndexBlocks,
} from './content-index'
import type { ContentIndexBlockFields } from '@/lib/content/blocks'

const jsonResponse = (docs: unknown[]) =>
  ({ ok: true, status: 200, json: async () => ({ docs }) }) as never

/** A non-OK stub. `clone` is what sahajCloudFetch calls to dump the SahajCloud error body. */
const errorResponse = (status: number) => {
  const response = { ok: false, status, statusText: '', json: async () => ({ errors: [] }) }

  return { ...response, clone: () => response } as never
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('resolveContentIndexItems', () => {
  it('appends select/locale to the computed endpoint and maps pages to cards', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse([{ id: 2, slug: 'about', title: 'About' }]))

    const items = await resolveContentIndexItems(
      { type: 'pages', limit: 10, apiEndpoint: '/api/pages?where[tags][in]=wisdom&limit=10' },
      { locale: 'en' },
    )

    expect(items).toHaveLength(1)
    expect(items[0].href).toBe('/about')

    const url = fetchSpy.mock.calls[0][0] as string

    expect(url).toContain('https://sahajcloud.test/api/pages?where[tags][in]=wisdom&limit=10')
    expect(url).toContain('select[title]=true')
    expect(url).toContain('locale=en')

    const init = fetchSpy.mock.calls[0][1] as RequestInit
    const auth = (init.headers as Record<string, string>).Authorization

    expect(auth).toContain('API-Key test-key')
  })

  it('logs the request, so this read appears in the dev request log like every other', async () => {
    // It was the one SahajCloud read with no `[PayloadCMS]` line, which the
    // debugging workflow in AGENTS.md is written around (#127).
    const logSpy = vi.spyOn(console, 'log')

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse([{ id: 2, slug: 'about', title: 'About' }]),
    )

    await resolveContentIndexItems(
      { type: 'pages', limit: 10, apiEndpoint: '/api/pages?limit=10' },
      { locale: 'en' },
    )

    const lines = logSpy.mock.calls
      .map(([first]) => first)
      .filter((line): line is string => typeof line === 'string' && line.startsWith('[PayloadCMS]'))

    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('GET https://sahajcloud.test/api/pages?limit=10')
    expect(lines[0]).toMatch(/→ 200$/)
  })

  it('caps the result at the block limit', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse([
        { id: 1, slug: 'a', title: 'A' },
        { id: 2, slug: 'b', title: 'B' },
        { id: 3, slug: 'c', title: 'C' },
      ]),
    )

    const items = await resolveContentIndexItems(
      { type: 'pages', limit: 2, apiEndpoint: '/api/pages?limit=2' },
      {},
    )

    expect(items).toHaveLength(2)
  })

  it('passes the site audiences to the lectures feed and routes cards to /lectures/:id', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse([{ id: 3, title: 'Lecture', thumbnail: null }]))

    const items = await resolveContentIndexItems(
      { type: 'lectures', limit: 100, apiEndpoint: '/api/lectures/for-audience?limit=100' },
      { audiences: [1, { id: 2 } as never] },
    )

    expect(items[0].href).toBe('/lectures/3')

    const url = fetchSpy.mock.calls[0][0] as string

    expect(url).toContain('audiences=1,2')
    expect(url).toContain('select[userChoices]=true')
    expect(url).toContain('populate[user-choices][title]=true')
  })

  it('degrades to [] on a non-200 (e.g. a malformed endpoint)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(errorResponse(400))

    const items = await resolveContentIndexItems(
      { type: 'lectures', limit: 100, apiEndpoint: '/api/lectures/for-audience?limit=100' },
      { audiences: [1] },
    )

    expect(items).toEqual([])
  })

  it('degrades to [] without fetching when a lectures block has no audiences', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const items = await resolveContentIndexItems(
      { type: 'lectures', limit: 100, apiEndpoint: '/api/lectures/for-audience?limit=100' },
      {},
    )

    expect(items).toEqual([])
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns [] when the block has no apiEndpoint', async () => {
    expect(await resolveContentIndexItems({ type: 'pages', limit: 10 }, {})).toEqual([])
  })
})

describe('resolveContentIndexTracks', () => {
  it('maps songs to playable tracks and populates album/artwork/tags', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse([
        {
          id: 9,
          title: 'Raga',
          url: 'https://cdn/audio.mp3',
          duration: 212,
          album: { id: 1, artist: 'Nightingale', artwork: { id: 2, url: 'https://cdn/art.jpg' } },
          tags: [{ id: 5, slug: 'strings', title: 'Strings' }],
        },
      ]),
    )

    const tracks = await resolveContentIndexTracks(
      { type: 'songs', limit: 10, apiEndpoint: '/api/songs?limit=10' },
      {},
    )

    expect(tracks).toEqual([
      {
        url: 'https://cdn/audio.mp3',
        title: 'Raga',
        credit: 'Nightingale',
        creditURL: '',
        thumbnailURL: 'https://cdn/art.jpg',
        duration: 212,
        tags: [{ id: 'strings', label: 'Strings' }],
      },
    ])

    const url = fetchSpy.mock.calls[0][0] as string

    expect(url).toContain('select[url]=true')
    // Unselected, the row comes back without a duration and prints no length.
    expect(url).toContain('select[duration]=true')
    expect(url).toContain('populate[albums][artwork]=true')
    expect(url).toContain('depth=2')
    // `url` and `thumbnailURL` are upload virtuals derived from `filename`.
    // Without it selected, SahajCloud returns them null, and every track drops.
    expect(url).toContain('select[filename]=true')
    expect(url).toContain('populate[images][filename]=true')
  })
})

describe('resolveContentIndexBlocks', () => {
  it('attaches resolvedItems on a clone without mutating the input', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse([{ id: 2, slug: 'about', title: 'About' }]),
    )

    const content = {
      root: {
        children: [
          {
            type: 'block',
            fields: {
              blockType: 'content-index',
              id: 'ci1',
              type: 'pages',
              limit: 10,
              apiEndpoint: '/api/pages?limit=10',
            },
          },
          { type: 'block', fields: { blockType: 'quote', id: 'q', text: 'hi' } },
        ],
      },
    }

    const resolved = await resolveContentIndexBlocks(content, { locale: 'en' })

    // The caller's own object is never mutated.
    const original = content.root.children[0].fields as ContentIndexBlockFields

    expect(original.resolvedItems).toBeUndefined()

    const cloned = (resolved as typeof content).root.children[0].fields as ContentIndexBlockFields

    expect(cloned.resolvedItems).toHaveLength(1)
    expect(cloned.resolvedItems?.[0].href).toBe('/about')
  })

  it('attaches resolvedTracks (not resolvedItems) for a songs block', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse([{ id: 9, title: 'Raga', url: 'https://cdn/a.mp3', album: 1, tags: [] }]),
    )

    const content = {
      root: {
        children: [
          {
            type: 'block',
            fields: {
              blockType: 'content-index',
              id: 'ci-songs',
              type: 'songs',
              limit: 10,
              apiEndpoint: '/api/songs?limit=10',
            },
          },
        ],
      },
    }

    const resolved = await resolveContentIndexBlocks(content, {})
    const fields = (resolved as typeof content).root.children[0].fields as ContentIndexBlockFields

    expect(fields.resolvedTracks).toHaveLength(1)
    expect(fields.resolvedTracks?.[0].url).toBe('https://cdn/a.mp3')
    expect(fields.resolvedItems).toBeUndefined()
  })

  it('returns the same content untouched when there are no content-index blocks', async () => {
    const content = {
      root: { children: [{ type: 'block', fields: { blockType: 'quote', id: 'q', text: 'hi' } }] },
    }

    expect(await resolveContentIndexBlocks(content, {})).toBe(content)
  })
})

describe('fetchContentIndexDocs retry', () => {
  it('retries a 500 before degrading to an empty list', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(errorResponse(500))

    const items = await resolveContentIndexItems({
      type: 'pages',
      limit: 10,
      apiEndpoint: '/api/pages?limit=10',
    })

    expect(items).toEqual([])
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })

  it('does not retry a 400', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(errorResponse(400))

    const items = await resolveContentIndexItems({
      type: 'pages',
      limit: 10,
      apiEndpoint: '/api/pages?limit=10',
    })

    expect(items).toEqual([])
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('reports the degrade once, outside the retry loop', async () => {
    // `vi.mock` keeps its call log across cases; this counts only this read.
    vi.mocked(Sentry.captureMessage).mockClear()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(errorResponse(500))

    await resolveContentIndexItems({
      type: 'pages',
      limit: 10,
      apiEndpoint: '/api/pages?limit=10',
    })

    // One message for the block that degraded. `withRetry` breadcrumbs each
    // retried attempt rather than capturing one, so the count is the degrade.
    expect(vi.mocked(Sentry.captureMessage)).toHaveBeenCalledTimes(1)
  })
})

describe('a meditations block', () => {
  const CHOICES = [
    {
      id: 16,
      type: 'mood',
      title: 'Had a great day',
      color: '#DF8E79',
      url: 'https://assets.test/16.svg',
      timings: ['evening'],
      eveningMeditation: 89,
    },
    {
      id: 1,
      type: 'mood',
      title: 'Excited for the day!',
      color: '#FFD591',
      url: 'https://assets.test/1.svg',
      timings: ['morning'],
      morningMeditation: 69,
    },
    { id: 25, type: 'duration', title: '5 min', timings: ['morning'], morningMeditation: 69 },
  ]

  /** Choices on the block's own endpoint, meditations on the by-id read. */
  const stubBothReads = (meditations: unknown[], choices: unknown[] = CHOICES) =>
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const docs = String(input).includes('/api/meditations') ? meditations : choices

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ docs, totalDocs: docs.length }),
      } as never)
    })

  const block = (limit = 20) => ({
    root: {
      children: [
        {
          type: 'block',
          fields: {
            blockType: 'content-index',
            id: 'ci-meds',
            type: 'meditations',
            limit,
            apiEndpoint: `/api/user-choices?where[id][in]=16,1,25&depth=1&limit=${limit}`,
          },
        },
      ],
    },
  })

  const resolveBlock = async (limit = 20) => {
    const content = block(limit)
    const resolved = await resolveContentIndexBlocks(content, { locale: 'fr' })

    return (resolved as typeof content).root.children[0].fields as ContentIndexBlockFields
  }

  it('attaches resolvedLibrary, and no resolvedItems', async () => {
    stubBothReads([
      { id: 89, durationMinutes: 15 },
      { id: 69, durationMinutes: 13 },
    ])

    const fields = await resolveBlock()

    expect(fields.resolvedItems).toBeUndefined()
    expect(fields.resolvedLibrary?.choices).toHaveLength(3)
    // 69 is named by a mood and a duration, so it is listed once carrying both.
    expect(fields.resolvedLibrary?.meditations).toEqual([
      expect.objectContaining({ id: 89, href: '/meditations/89', choiceIds: [16] }),
      expect.objectContaining({ id: 69, href: '/meditations/69', choiceIds: [1, 25] }),
    ])
  })

  it('reads the choices at the page locale and the meditations at locale=all', async () => {
    // The whole point of the two reads: `?locale=fr` over meditations answers
    // `totalDocs: 0`, and `locale=en` would drop a localized slot meditation.
    const fetchSpy = stubBothReads([{ id: 89, durationMinutes: 15 }])

    await resolveBlock()

    const urls = fetchSpy.mock.calls.map((call) => String(call[0]))
    const choicesUrl = urls.find((url) => url.includes('/api/user-choices')) ?? ''
    const meditationsUrl = urls.find((url) => url.includes('/api/meditations')) ?? ''

    expect(choicesUrl).toContain('locale=fr')
    expect(choicesUrl).toContain('select[timings]=true')
    // SahajCloud bakes `depth=1` into the endpoint. Ours must be the only one:
    // a duplicate `depth` parses to an array and the backend 400s.
    expect(choicesUrl).toContain('depth=0')
    expect(choicesUrl).not.toContain('depth=1')

    expect(meditationsUrl).toContain('locale=all')
    expect(meditationsUrl).toContain('where[id][in]=89,69')
    expect(meditationsUrl).toContain('select[_status]=true')
    expect(meditationsUrl).not.toContain('locale=en')
  })

  it('reads the meditations once, however many choices name them', async () => {
    const fetchSpy = stubBothReads([
      { id: 89, durationMinutes: 15 },
      { id: 69, durationMinutes: 13 },
    ])

    await resolveBlock()

    expect(
      fetchSpy.mock.calls.filter((c) => String(c[0]).includes('/api/meditations')),
    ).toHaveLength(1)
  })

  it('drops a slot whose meditation is unpublished, missing, or has no length', async () => {
    stubBothReads([
      { id: 89, durationMinutes: 15, _status: 'draft' },
      { id: 69, duration: 20 }, // 20s → under a minute, so no label to render
    ])

    const fields = await resolveBlock()

    expect(fields.resolvedLibrary?.meditations).toEqual([])
    // The tiles go with the cards: no choice is left linking nowhere.
    expect(fields.resolvedLibrary?.choices.flatMap((c) => Object.values(c.slots))).toEqual([])
  })

  it('drops a goal choice rather than rendering a third question', async () => {
    stubBothReads(
      [{ id: 89, durationMinutes: 15 }],
      [
        ...CHOICES.slice(0, 1),
        {
          id: 40,
          type: 'goal',
          title: 'Sleep better',
          timings: ['evening'],
          eveningMeditation: 89,
        },
      ],
    )

    const fields = await resolveBlock()

    expect(fields.resolvedLibrary?.choices.map((c) => c.id)).toEqual([16])
  })

  it('renders an empty library when the meditation read fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) =>
      String(input).includes('/api/meditations')
        ? Promise.resolve(errorResponse(500))
        : Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ docs: CHOICES, totalDocs: CHOICES.length }),
          } as never),
    )

    const fields = await resolveBlock()

    expect(fields.resolvedLibrary).toEqual({ choices: [], meditations: [] })
  })
})

describe('an unknown block type', () => {
  it('degrades to an empty list instead of throwing the page away', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    // A type SahajCloud offers before this build knows it: `pages/[slug]/+data.ts`
    // awaits this with no catch, so a throw here would 500 the whole page.
    const items = await resolveContentIndexItems({
      type: 'albums' as ContentIndexBlockFields['type'],
      limit: 10,
      apiEndpoint: '/api/albums?limit=10',
    })

    expect(items).toEqual([])
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
