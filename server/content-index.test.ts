import { describe, it, expect, vi, beforeEach } from 'vitest'

// Provide CMS config without a request context, run the fetch synchronously
// (no KV), and silence Sentry warnings on the degrade paths.
vi.mock('./cms-context', () => ({
  getCmsContext: () => ({ apiKey: 'test-key', baseURL: 'https://cms.test', kv: undefined }),
}))
vi.mock('./kv-cache', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./kv-cache')>()

  return { ...actual, withCache: (opts: { fetchFn: () => unknown }) => opts.fetchFn() }
})
vi.mock('@sentry/react', () => ({ captureMessage: vi.fn() }))

import {
  resolveContentIndexItems,
  resolveContentIndexTracks,
  resolveContentIndexBlocks,
} from './content-index'
import type { ContentIndexBlockFields } from '../lib/cms-blocks'

const jsonResponse = (docs: unknown[]) => ({ ok: true, json: async () => ({ docs }) }) as never

beforeEach(() => {
  vi.restoreAllMocks()
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

    expect(url).toContain('https://cms.test/api/pages?where[tags][in]=wisdom&limit=10')
    expect(url).toContain('select[title]=true')
    expect(url).toContain('locale=en')

    const init = fetchSpy.mock.calls[0][1] as RequestInit
    const auth = (init.headers as Record<string, string>).Authorization

    expect(auth).toContain('API-Key test-key')
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
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 400 } as never)

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
          album: { id: 1, artist: 'Nightingale', artwork: { id: 2, url: 'https://cdn/art.jpg' } },
          tags: [{ id: 5, slug: 'strings' }],
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
        duration: 0,
        tags: ['strings'],
      },
    ])

    const url = fetchSpy.mock.calls[0][0] as string

    expect(url).toContain('select[url]=true')
    expect(url).toContain('populate[albums][artwork]=true')
    expect(url).toContain('depth=2')
    // `url`/`thumbnailURL` are upload virtuals derived from `filename`; without
    // it selected the CMS returns them null and every track is dropped.
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

    // The original (cached) object is never mutated.
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
