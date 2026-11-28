// @vitest-environment jsdom
/**
 * What the picker does after mount, which no SSR render can show: the browser
 * reads its own zone and either confirms the slot the server guessed or
 * replaces it.
 *
 * It lives in its own file because jsdom costs setup time per file, and because
 * stubbing the browser's zone is module-wide.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ResolvedMood } from '@/lib/content/blocks'
import { MoodPicker } from './MoodPicker'

const MOODS: ResolvedMood[] = [
  {
    id: '1',
    title: 'Calm',
    color: '#7bbf8e',
    iconUrl: null,
    slots: { morning: '/meditations/11' },
  },
  {
    id: '2',
    title: 'Restless',
    color: '#d98b5f',
    iconUrl: null,
    slots: { evening: '/meditations/13' },
  },
]

/**
 * Makes `Intl.DateTimeFormat()` report `zone`, the way a browser in that zone
 * does, while a call that names a zone still gets the real formatter — that is
 * the one `timeOfDaySlot` reads the hour with.
 */
function stubBrowserZone(zone: string) {
  const Real = Intl.DateTimeFormat

  // A `function`, not an arrow: `timeOfDaySlot` reads the hour through `new
  // Intl.DateTimeFormat(zone, …)`, and an arrow is not constructible — the
  // `TypeError` lands in that function's own catch and reads as an unusable
  // zone, so every case passes for the wrong reason.
  vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(function (
    locales?: Intl.LocalesArgument,
    options?: Intl.DateTimeFormatOptions,
  ) {
    const real = new Real(locales, options)

    if (locales !== undefined || options !== undefined) return real

    return {
      ...real,
      resolvedOptions: () => ({ ...real.resolvedOptions(), timeZone: zone }),
    }
  } as never)
}

/** The tiles on the page, by their mood's title. */
const shown = () => screen.queryAllByRole('listitem').map((item) => item.textContent)

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('MoodPicker after mount', () => {
  // 23:00 UTC is 09:00 the next day in Sydney and midnight in London.
  const INSTANT = new Date('2026-06-15T23:00:00Z')

  function at(zone: string) {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(INSTANT)
    stubBrowserZone(zone)
  }

  it('leaves the tiles alone where the browser agrees with the server', () => {
    at('Australia/Sydney')
    render(<MoodPicker moods={MOODS} serverSlot="morning" />)

    expect(shown()).toEqual(['Calm'])
  })

  it('swaps the tiles where the browser disagrees', () => {
    // The server guessed morning; this visitor's browser says it is evening.
    at('Europe/London')
    render(<MoodPicker moods={MOODS} serverSlot="morning" />)

    expect(shown()).toEqual(['Restless'])
  })

  it('narrows the full set the server sent when it had no zone to read', () => {
    at('Europe/London')
    render(<MoodPicker moods={MOODS} serverSlot={null} />)

    expect(shown()).toEqual(['Restless'])
  })

  it('leaves the server slot standing when the browser zone is unusable', () => {
    at('Not/AZone')
    render(<MoodPicker moods={MOODS} serverSlot="morning" />)

    expect(shown()).toEqual(['Calm'])
  })

  it('shows every mood when neither side could name a zone', () => {
    at('Not/AZone')
    render(<MoodPicker moods={MOODS} serverSlot={null} />)

    expect(shown()).toEqual(['Calm', 'Restless'])
  })
})
