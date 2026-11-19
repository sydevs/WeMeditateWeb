import { describe, it, expect, vi, beforeEach } from 'vitest'

// Provide SahajCloud config without a request context, and silence Sentry
// warnings on the degrade paths.
vi.mock('./sahajcloud-context', () => ({
  getSahajCloudContext: () => ({ apiKey: 'test-key', baseURL: 'https://sahajcloud.test' }),
}))
vi.mock('@sentry/cloudflare', () => ({ captureMessage: vi.fn() }))

import * as Sentry from '@sentry/cloudflare'
import {
  resolveContentIndexItems,
  resolveContentIndexTracks,
  resolveContentIndexBlocks,
} from './content-index'
import type { ContentIndexBlockFields } from '../lib/content-blocks'

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

  it('resolves a meditations block via user-choice categories (single depth, flattened + tagged)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse([
        {
          id: 25,
          title: '5 min',
          morningMeditation: { id: 105, label: 'Feel Calm', duration: 300, thumbnail: null },
        },
      ]),
    )

    const items = await resolveContentIndexItems(
      {
        type: 'meditations',
        limit: 100,
        // SahajCloud bakes `depth=1` into the endpoint. The resolver must not
        // append a second one (duplicate `depth` params 400 the backend).
        apiEndpoint: '/api/user-choices?where[id][in]=25&depth=1&limit=100',
      },
      { locale: 'en' },
    )

    expect(items).toEqual([
      expect.objectContaining({
        id: 105,
        title: 'Feel Calm',
        href: '/meditations/105',
        playButton: true,
        durationMinutes: 5,
        tags: [{ id: '25', label: '5 min' }],
      }),
    ])

    const url = fetchSpy.mock.calls[0][0] as string

    // Baked-in depth is stripped. Only the depth=2 above remains.
    expect(url).toContain('https://sahajcloud.test/api/user-choices?where[id][in]=25&limit=100')
    expect(url).toContain('depth=2')
    expect(url).not.toContain('depth=1')
    expect(url).toContain('populate[meditations][thumbnail]=true')
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

    // One message for the block that degraded. `withRetry` reports each retried
    // attempt itself, as it does for every caller — see the PR's question thread.
    expect(vi.mocked(Sentry.captureMessage)).toHaveBeenCalledTimes(1)
  })
})

describe('a moods block', () => {
  it('attaches resolvedMoods, filtered to the slot, and no resolvedItems', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = String(input)
      const docs = url.includes('/api/meditations')
        ? [{ id: 89, durationMinutes: 15 }]
        : [
            {
              id: 16,
              title: 'Had a great day',
              color: '#DF8E79',
              url: 'https://assets.test/16.svg',
              timings: ['evening'],
              eveningMeditation: 89,
            },
            {
              id: 1,
              title: 'Excited for the day!',
              color: '#FFD591',
              url: 'https://assets.test/1.svg',
              timings: ['morning'],
              morningMeditation: 69,
            },
          ]

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ docs, totalDocs: docs.length }),
      } as never)
    })

    const content = {
      root: {
        children: [
          {
            type: 'block',
            fields: {
              blockType: 'content-index',
              id: 'ci-moods',
              type: 'moods',
              limit: 20,
              apiEndpoint:
                '/api/user-choices?where[isFeatured][equals]=true&where[type][equals]=mood&limit=20',
            },
          },
        ],
      },
    }

    const resolved = await resolveContentIndexBlocks(content, {})
    const fields = (resolved as typeof content).root.children[0].fields as ContentIndexBlockFields

    // No request context in the lane, so the slot falls back to evening.
    expect(fields.resolvedMoods).toHaveLength(1)
    expect(fields.resolvedMoods?.[0]).toMatchObject({ moodId: 16, href: '/meditations/89' })
    expect(fields.resolvedItems).toBeUndefined()
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
