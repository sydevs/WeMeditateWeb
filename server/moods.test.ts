import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./sahajcloud-context', () => ({
  getSahajCloudContext: () => ({ apiKey: 'test-key', baseURL: 'https://sahajcloud.test' }),
}))
vi.mock('@sentry/cloudflare', () => ({ captureMessage: vi.fn() }))

import * as Sentry from '@sentry/cloudflare'
import { featuredMoodCards, moodCardsFromDocs, moodsForSlot, type MoodDoc } from './moods'

/** A featured mood, as the user-choices read returns one. */
const mood = (id: number, timings: string[], slots: Record<string, number>): MoodDoc => ({
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

const meditation = (id: number, durationMinutes: number) => ({ id, durationMinutes })

/** The meditations read answers whichever ids the query asked for. */
function mockMeditations(available: Record<number, number>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
    const url = String(input)
    const ids = /where\[id\]\[in\]=([^&]*)/.exec(url)?.[1]?.split(',') ?? []
    const docs = ids
      .map(Number)
      .filter((id) => id in available)
      .map((id) => meditation(id, available[id]))

    return Promise.resolve({ ok: true, status: 200, json: async () => ({ docs }) } as never)
  })
}

const DURATIONS = { 69: 15, 101: 13, 85: 20, 102: 18, 37: 15 }

beforeEach(() => {
  vi.restoreAllMocks()
  vi.mocked(Sentry.captureMessage).mockClear()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('moodsForSlot', () => {
  it('keeps only the moods that offer the slot', () => {
    expect(moodsForSlot(ALL, 'morning').map((doc) => doc.id)).toEqual([1, 2, 3, 4])
  })

  it('keeps every mood when no slot is given', () => {
    expect(moodsForSlot(ALL)).toHaveLength(5)
  })
})

describe('moodCardsFromDocs', () => {
  it('resolves one tile per mood offering the slot', async () => {
    mockMeditations(DURATIONS)

    const cards = await moodCardsFromDocs(ALL, { slot: 'morning' })

    expect(cards.map((card) => card.moodId)).toEqual([1, 2, 3, 4])
    expect(cards[0]).toMatchObject({
      href: '/meditations/69',
      durationMinutes: 15,
      color: '#FFD591',
      iconUrl: 'https://assets.test/mood-1.svg',
    })
  })

  it('reads the meditations at locale=en, whatever locale the moods were read at', async () => {
    const fetchSpy = mockMeditations(DURATIONS)

    await moodCardsFromDocs(ALL, { slot: 'morning' })

    expect(String(fetchSpy.mock.calls[0][0])).toContain('locale=en')
  })

  it('caps after the slot filter, so a limit of 6 still shows four morning moods', async () => {
    mockMeditations(DURATIONS)

    const cards = await moodCardsFromDocs(ALL, { slot: 'morning', limit: 6 })

    expect(cards).toHaveLength(4)
  })

  it('applies the limit to the filtered set', async () => {
    mockMeditations(DURATIONS)

    const cards = await moodCardsFromDocs(ALL, { slot: 'morning', limit: 2 })

    expect(cards.map((card) => card.moodId)).toEqual([1, 2])
  })

  it('drops a mood whose meditation does not come back, and warns once', async () => {
    mockMeditations({ 69: 15, 85: 20, 102: 18 })

    const cards = await moodCardsFromDocs(ALL, { slot: 'morning' })

    expect(cards.map((card) => card.moodId)).toEqual([1, 3, 4])
    expect(cards.every((card) => !card.href.includes('undefined'))).toBe(true)
    expect(vi.mocked(Sentry.captureMessage)).toHaveBeenCalledWith(
      'a featured mood has no meditation for its slot',
      expect.objectContaining({ level: 'warning' }),
    )
  })

  it('warns when the response is short of what the data holds', async () => {
    mockMeditations(DURATIONS)

    await moodCardsFromDocs(ALL, { slot: 'morning', totalDocs: 14 })

    expect(vi.mocked(Sentry.captureMessage)).toHaveBeenCalledWith(
      'mood finder read fewer moods than the data holds',
      expect.objectContaining({ extra: expect.objectContaining({ returned: 5, totalDocs: 14 }) }),
    )
  })

  it('lists every slot a mood offers when no slot is given', async () => {
    mockMeditations(DURATIONS)

    const cards = await moodCardsFromDocs(ALL)

    expect(cards.map((card) => card.href)).toEqual([
      '/meditations/69',
      '/meditations/101',
      '/meditations/85',
      '/meditations/102',
      '/meditations/37',
    ])
  })
})

describe('featuredMoodCards', () => {
  it('sends the featured-mood filter and the page locale, and reads every mood', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = String(input)
      const docs = url.includes('/api/meditations')
        ? [meditation(69, 15), meditation(101, 13), meditation(85, 20), meditation(102, 18)]
        : MORNING

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ docs, totalDocs: docs.length }),
      } as never)
    })

    const cards = await featuredMoodCards({ locale: 'fr', slot: 'morning' })

    const moodsUrl = String(fetchSpy.mock.calls[0][0])
    expect(moodsUrl).toContain('where[isFeatured][equals]=true')
    expect(moodsUrl).toContain('where[type][equals]=mood')
    expect(moodsUrl).toContain('locale=fr')
    // The block's limit may be 10; this read must never be what starves a slot.
    expect(moodsUrl).toContain('limit=100')
    expect(cards).toHaveLength(4)
  })

  it('degrades to an empty list, with one warning, when the read fails', async () => {
    const response = { ok: false, status: 400, statusText: '', json: async () => ({ errors: [] }) }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ...response,
      clone: () => response,
    } as never)

    expect(await featuredMoodCards({ slot: 'evening' })).toEqual([])
    expect(vi.mocked(Sentry.captureMessage)).toHaveBeenCalledWith(
      'featured moods read failed',
      expect.objectContaining({ level: 'warning' }),
    )
  })
})
