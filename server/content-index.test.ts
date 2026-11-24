import { describe, it, expect, vi, beforeEach } from 'vitest'

// Provide SahajCloud config without a request context, and silence Sentry
// warnings on the degrade paths.
vi.mock('./sahajcloud/context', () => ({
  getSahajCloudContext: () => ({ apiKey: 'test-key', baseURL: 'https://sahajcloud.test' }),
}))
vi.mock('@sentry/cloudflare', () => ({ captureMessage: vi.fn() }))

/**
 * Stands in for the Workers request the server-side slot is read off.
 * `zone: null` makes `getContext` throw, as it does off a request — Ladle, a
 * unit render, or `pnpm dev` outside the Workers runtime.
 */
const request = vi.hoisted(() => ({ zone: null as string | null | undefined }))

vi.mock('hono/context-storage', () => ({
  getContext: () => {
    if (request.zone === null) throw new Error('no request context')

    return { req: { raw: { cf: { timezone: request.zone } } } }
  },
}))

import {
  resolveContentIndexItems,
  resolveContentIndexTracks,
  resolveContentIndexBlocks,
  visitorTimeOfDay,
} from './content-index'
import { forgetReportedWarnings } from './error-utils'
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
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  // `warnOnce` memoises per isolate, so a dropped slot one case expects would
  // otherwise be swallowed by an earlier case that already reported it.
  forgetReportedWarnings()
  request.zone = null
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

describe('visitorTimeOfDay', () => {
  /**
   * One instant, two visitors. 23:00 UTC is 09:00 the next day in Sydney and
   * midnight in London, so the same request moment offers one the morning moods
   * and the other the evening ones. Mid-June, so both zones are at a fixed
   * offset and the expected hour is arithmetic rather than a DST guess.
   */
  const INSTANT = new Date('2026-06-15T23:00:00Z')

  it('reads the slot from the zone Cloudflare resolved for the request', () => {
    request.zone = 'Australia/Sydney'
    expect(visitorTimeOfDay(INSTANT)).toBe('morning')

    request.zone = 'Europe/London'
    expect(visitorTimeOfDay(INSTANT)).toBe('evening')
  })

  it('answers null for a request Cloudflare gave no zone', () => {
    request.zone = undefined
    expect(visitorTimeOfDay(INSTANT)).toBeNull()
  })

  it('answers null for a zone Intl cannot use, rather than throwing', () => {
    request.zone = 'Not/AZone'
    expect(() => visitorTimeOfDay(INSTANT)).not.toThrow()
    expect(visitorTimeOfDay(INSTANT)).toBeNull()
  })

  it('answers null off a request, where there is no context at all', () => {
    request.zone = null
    expect(visitorTimeOfDay(INSTANT)).toBeNull()
  })
})

describe('resolveContentIndexBlocks (user-choices)', () => {
  const ENDPOINT =
    '/api/user-choices?where[type][in]=mood&where[isFeatured][equals]=true' +
    '&where[isParent][equals]=false&sort=order,id&limit=20'

  const choice = (overrides: Record<string, unknown>) => ({
    id: 1,
    title: 'Calm',
    type: 'mood',
    isFeatured: true,
    color: '#7bbf8e',
    url: 'https://assets.test/calm.svg',
    ...overrides,
  })

  const blockContent = (fields: Partial<ContentIndexBlockFields> = {}) => ({
    root: {
      children: [
        {
          type: 'block',
          fields: {
            blockType: 'content-index',
            type: 'user-choices',
            limit: 20,
            apiEndpoint: ENDPOINT,
            ...fields,
          },
        },
      ],
    },
  })

  /** The resolved block of a one-block page. */
  const resolvedBlock = (content: unknown) =>
    (content as { root: { children: { fields: ContentIndexBlockFields }[] } }).root.children[0]
      .fields

  it('offers one tile per mood with a published meditation for the slot', async () => {
    request.zone = 'Europe/London'

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse([
          choice({ id: 1, title: 'Calm', morningMeditation: 11 }),
          choice({ id: 2, title: 'Grateful', afternoonMeditation: 12 }),
          choice({ id: 3, title: 'Restless', eveningMeditation: 13 }),
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          { id: 11, _status: 'published' },
          { id: 12, _status: 'published' },
          { id: 13, _status: 'published' },
        ]),
      )

    const fields = resolvedBlock(await resolveContentIndexBlocks(blockContent(), { locale: 'fr' }))

    expect(fields.resolvedMoods).toHaveLength(3)
    expect(fields.resolvedMoods?.[0]).toMatchObject({
      id: '1',
      title: 'Calm',
      color: '#7bbf8e',
      iconUrl: 'https://assets.test/calm.svg',
      slots: { morning: '/meditations/11' },
    })

    const choicesUrl = fetchSpy.mock.calls[0][0] as string

    expect(choicesUrl).toContain(ENDPOINT)
    expect(choicesUrl).toContain('select[morningMeditation]=true')
    // The icon's `url` is virtual, derived from `filename`.
    expect(choicesUrl).toContain('select[filename]=true')
    expect(choicesUrl).toContain('depth=0')
    // The choices are read at the page's own locale: the titles are localized.
    expect(choicesUrl).toContain('locale=fr')
  })

  it('reads the slot meditations at locale=all, never at the page locale', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse([choice({ morningMeditation: 11 })]))
      .mockResolvedValueOnce(jsonResponse([{ id: 11, _status: 'published' }]))

    await resolveContentIndexBlocks(blockContent(), { locale: 'fr' })

    const meditationsUrl = fetchSpy.mock.calls[1][0] as string

    // `filterMeditationsByLocale` answers `totalDocs: 0` at any single
    // non-English locale, and `locale=en` would drop a localized slot.
    expect(meditationsUrl).toContain('/api/meditations?locale=all')
    expect(meditationsUrl).not.toContain('locale=fr')
    expect(meditationsUrl).toContain('where[id][in]=11')
    expect(meditationsUrl).toContain('select[_status]=true')
  })

  it('drops a slot whose meditation is a draft, and the mood left with none', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse([
          choice({ id: 1, morningMeditation: 11, eveningMeditation: 12 }),
          choice({ id: 2, title: 'Draft only', morningMeditation: 13 }),
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          { id: 11, _status: 'published' },
          { id: 12, _status: 'draft' },
          { id: 13, _status: 'draft' },
        ]),
      )

    const fields = resolvedBlock(await resolveContentIndexBlocks(blockContent(), {}))

    expect(fields.resolvedMoods).toHaveLength(1)
    expect(fields.resolvedMoods?.[0].slots).toEqual({ morning: '/meditations/11' })
  })

  it('drops a meditation the read did not return at all', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse([choice({ morningMeditation: 11 })]))
      .mockResolvedValueOnce(jsonResponse([]))

    const fields = resolvedBlock(await resolveContentIndexBlocks(blockContent(), {}))

    expect(fields.resolvedMoods).toEqual([])
  })

  it('renders nothing but the mood tiles the site supports', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse([
          choice({ id: 1, morningMeditation: 11 }),
          // The block can be configured for more than the site renders.
          choice({ id: 2, type: 'duration', morningMeditation: 11 }),
          choice({ id: 3, type: 'goal', morningMeditation: 11 }),
          choice({ id: 4, isFeatured: false, morningMeditation: 11 }),
        ]),
      )
      .mockResolvedValueOnce(jsonResponse([{ id: 11, _status: 'published' }]))

    const fields = resolvedBlock(await resolveContentIndexBlocks(blockContent(), {}))

    expect(fields.resolvedMoods?.map((mood) => mood.id)).toEqual(['1'])
  })

  it('attaches the server slot beside the tiles, so the first paint narrows them', async () => {
    // Only `Date` is faked: faking timers wholesale would stall the fetches.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-06-15T23:00:00Z'))

    try {
      const fetchOnce = () =>
        vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValueOnce(jsonResponse([choice({ morningMeditation: 11 })]))
          .mockResolvedValueOnce(jsonResponse([{ id: 11, _status: 'published' }]))

      request.zone = 'Australia/Sydney'
      fetchOnce()

      expect(resolvedBlock(await resolveContentIndexBlocks(blockContent(), {})).resolvedSlot).toBe(
        'morning',
      )

      request.zone = 'Europe/London'
      fetchOnce()

      expect(resolvedBlock(await resolveContentIndexBlocks(blockContent(), {})).resolvedSlot).toBe(
        'evening',
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('refuses an icon URL that could not go inside a CSS url()', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse([
          // An upload's extension is unsanitised upstream, so a quote can reach
          // `url`. It would close the CSS string the tile draws it in.
          choice({
            id: 1,
            url: 'https://assets.test/i.svg");position:fixed;inset:0;background:red;--x:url("',
            morningMeditation: 11,
          }),
          choice({ id: 2, url: 'javascript:alert(1)', morningMeditation: 11 }),
        ]),
      )
      .mockResolvedValueOnce(jsonResponse([{ id: 11, _status: 'published' }]))

    const fields = resolvedBlock(await resolveContentIndexBlocks(blockContent(), {}))

    expect(fields.resolvedMoods?.[0].iconUrl).not.toContain('"')
    // A refused scheme drops the icon, and keeps the tile.
    expect(fields.resolvedMoods?.[1].iconUrl).toBeNull()
    expect(fields.resolvedMoods).toHaveLength(2)
  })

  it('keeps a non-hex colour out of the tile rather than painting with it', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse([choice({ color: 'rebeccapurple', morningMeditation: 11 })]),
      )
      .mockResolvedValueOnce(jsonResponse([{ id: 11, _status: 'published' }]))

    const fields = resolvedBlock(await resolveContentIndexBlocks(blockContent(), {}))

    expect(fields.resolvedMoods?.[0].color).toBeNull()
  })

  it('renders no tiles when the meditation read fails', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse([choice({ morningMeditation: 11 })]))
      // A 400 is a client error, which `withRetry` does not retry.
      .mockResolvedValueOnce(errorResponse(400))

    const fields = resolvedBlock(await resolveContentIndexBlocks(blockContent(), {}))

    expect(fields.resolvedMoods).toEqual([])
  })
})
