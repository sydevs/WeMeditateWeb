import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./sahajcloud-context', () => ({
  getSahajCloudContext: () => ({ apiKey: 'test-key', baseURL: 'https://sahajcloud.test' }),
  tryGetContext: () => undefined,
}))
// Every warning this module sends goes through `createWarnOnce`.
vi.mock('@sentry/cloudflare', () => ({ captureMessage: vi.fn() }))
vi.mock('@sentry/react', () => ({ captureMessage: vi.fn(), captureException: vi.fn() }))

import * as Sentry from '@sentry/cloudflare'
import { featuredMoodCards } from './moods'

/** A featured mood, as the user-choices read returns one. */
const mood = (id: number, timings: string[], slots: Record<string, number>) => ({
  id,
  title: `Mood ${id}`,
  color: '#FFD591',
  url: `https://assets.test/mood-${id}.svg`,
  timings,
  morningMeditation: null,
  afternoonMeditation: null,
  eveningMeditation: null,
  ...slots,
})

const MORNING = [
  mood(1, ['morning'], { morningMeditation: 69 }),
  mood(2, ['morning'], { morningMeditation: 101 }),
  mood(3, ['morning'], { morningMeditation: 85 }),
  mood(4, ['morning'], { morningMeditation: 102 }),
]
const AFTERNOON = [mood(5, ['afternoon'], { afternoonMeditation: 37 })]
const ALL = [...MORNING, ...AFTERNOON]

const DURATIONS: Record<number, number> = { 69: 15, 101: 13, 85: 20, 102: 18, 37: 15 }

/**
 * Answers the moods read with `docs`, and the meditations read with whichever
 * of `available` the query asked for.
 */
function mockReads(docs: unknown[], available: Record<number, number> = DURATIONS) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
    const url = String(input)

    if (!url.includes('/api/meditations')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ docs, totalDocs: docs.length }),
      } as never)
    }
    const ids = /where\[id\]\[in\]=([^&]*)/.exec(url)?.[1]?.split(',') ?? []
    const meditations = ids
      .map(Number)
      .filter((id) => id in available)
      .map((id) => ({ id, durationMinutes: available[id] }))

    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ docs: meditations }),
    } as never)
  })
}

/** A non-OK stub. `clone` is what sahajCloudFetch calls to dump the error body. */
const errorResponse = (status: number) => {
  const response = { ok: false, status, statusText: '', json: async () => ({ errors: [] }) }

  return { ...response, clone: () => response } as never
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.mocked(Sentry.captureMessage).mockClear()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('featuredMoodCards · the reads', () => {
  it('sends the featured-mood filter and the page locale, and reads every mood', async () => {
    const fetchSpy = mockReads(ALL)

    await featuredMoodCards({ locale: 'fr', slot: 'morning' })

    const moodsUrl = String(fetchSpy.mock.calls[0][0])
    expect(moodsUrl).toContain('where[isFeatured][equals]=true')
    expect(moodsUrl).toContain('where[type][equals]=mood')
    expect(moodsUrl).toContain('locale=fr')
    // The block's limit may be 10; this read must never be what starves a slot.
    expect(moodsUrl).toContain('limit=100')
  })

  it('reads the meditations at locale=en, whatever locale the moods were read at', async () => {
    const fetchSpy = mockReads(ALL)

    await featuredMoodCards({ locale: 'fr', slot: 'morning' })

    expect(String(fetchSpy.mock.calls[1][0])).toContain('locale=en')
  })

  it('degrades to an empty list, with one warning, when the moods read fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(errorResponse(400))

    expect(await featuredMoodCards({ slot: 'evening' })).toEqual([])
    expect(vi.mocked(Sentry.captureMessage)).toHaveBeenCalledWith(
      'featured moods read failed',
      expect.objectContaining({ level: 'warning' }),
    )
  })

  it('degrades rather than throwing out of data() when the meditations read fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) =>
      String(input).includes('/api/meditations')
        ? Promise.resolve(errorResponse(400))
        : Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ docs: MORNING, totalDocs: MORNING.length }),
          } as never),
    )

    await expect(featuredMoodCards({ slot: 'morning' })).resolves.toEqual([])
    expect(vi.mocked(Sentry.captureMessage)).toHaveBeenCalledWith(
      'mood finder could not read the meditations',
      expect.objectContaining({ level: 'warning' }),
    )
  })
})

describe('featuredMoodCards · the tiles', () => {
  it('resolves one tile per mood offering the slot', async () => {
    mockReads(ALL)

    const cards = await featuredMoodCards({ slot: 'morning' })

    expect(cards.map((card) => card.moodId)).toEqual([1, 2, 3, 4])
    expect(cards[0]).toMatchObject({
      href: '/meditations/69',
      durationMinutes: 15,
      color: '#FFD591',
      iconUrl: 'https://assets.test/mood-1.svg',
    })
  })

  it('caps after the slot filter, so a limit of 6 still shows four morning moods', async () => {
    mockReads(ALL)

    expect(await featuredMoodCards({ slot: 'morning', limit: 6 })).toHaveLength(4)
  })

  it('applies the limit to the filtered set', async () => {
    mockReads(ALL)

    const cards = await featuredMoodCards({ slot: 'morning', limit: 2 })

    expect(cards.map((card) => card.moodId)).toEqual([1, 2])
  })

  it('lists every slot a mood names when no slot is given', async () => {
    mockReads(ALL)

    const cards = await featuredMoodCards({})

    expect(cards.map((card) => card.href)).toEqual([
      '/meditations/69',
      '/meditations/101',
      '/meditations/85',
      '/meditations/102',
      '/meditations/37',
    ])
  })

  it('pairs a mood with the slots its timings name, not its filled fields', async () => {
    // Upstream fills one slot per featured mood, but nothing stops a second
    // field carrying the same id — which would otherwise list it twice.
    mockReads([mood(1, ['morning'], { morningMeditation: 69, eveningMeditation: 69 })])

    expect(await featuredMoodCards({})).toHaveLength(1)
  })

  it('drops a mood whose meditation does not come back, and warns', async () => {
    mockReads(ALL, { 69: 15, 85: 20, 102: 18 })

    const cards = await featuredMoodCards({ slot: 'morning' })

    expect(cards.map((card) => card.moodId)).toEqual([1, 3, 4])
    expect(cards.every((card) => !card.href.includes('undefined'))).toBe(true)
    expect(vi.mocked(Sentry.captureMessage)).toHaveBeenCalledWith(
      'a featured mood has no meditation for its slot',
      expect.objectContaining({ level: 'warning' }),
    )
  })

  it('warns for a slot a mood names but has not filled', async () => {
    mockReads([mood(7, ['evening'], {})])

    expect(await featuredMoodCards({ slot: 'evening' })).toEqual([])
    expect(vi.mocked(Sentry.captureMessage)).toHaveBeenCalledWith(
      'a featured mood has no meditation for its slot',
      expect.objectContaining({ extra: expect.objectContaining({ moodId: 7, slot: 'evening' }) }),
    )
  })

  it('warns when the response is short of what the data holds', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) =>
      String(input).includes('/api/meditations')
        ? Promise.resolve({ ok: true, status: 200, json: async () => ({ docs: [] }) } as never)
        : Promise.resolve({
            ok: true,
            status: 200,
            // More featured moods exist than this page of the read returned.
            json: async () => ({ docs: ALL, totalDocs: 14 }),
          } as never),
    )

    await featuredMoodCards({ slot: 'morning' })

    expect(vi.mocked(Sentry.captureMessage)).toHaveBeenCalledWith(
      'mood finder read fewer moods than the data holds',
      expect.objectContaining({ extra: expect.objectContaining({ returned: 5, totalDocs: 14 }) }),
    )
  })
})
