import { describe, it, expect } from 'vitest'
import {
  bufferedPercent,
  formatClock,
  holdInWindow,
  percentSeek,
  replayFrom,
  resolveClipWindow,
  secondsToIsoDuration,
} from './clip'

describe('resolveClipWindow', () => {
  // A full lecture carries neither bound (`lib/content/lecture-shape.ts`), and must get no seek and no
  // injected pause: the player renders the library's own time controls for it.
  it.each([
    ['both null', null, null],
    ['both undefined', undefined, undefined],
    ['a zero start and no stop', 0, null],
    ['a negative start and no stop', -5, null],
  ])('resolves no window for %s', (_label, start, stop) => {
    expect(resolveClipWindow(start, stop)).toBeNull()
  })

  it('resolves a clip from both bounds', () => {
    expect(resolveClipWindow(5, 15)).toEqual({ start: 5, end: 15 })
  })

  it('keeps a start with no stop, which runs to the end of the media', () => {
    expect(resolveClipWindow(5, null)).toEqual({ start: 5, end: null })
  })

  // A window that would play nothing is not a window. Dropping the stop leaves the start as the
  // only bound, rather than a player that pauses the instant it seeks.
  it.each([
    ['a stop before the start', 10, 4],
    ['a stop equal to the start', 10, 10],
  ])('drops %s', (_label, start, stop) => {
    expect(resolveClipWindow(start, stop)).toEqual({ start, end: null })
  })

  it('ignores a stop on a video with no start', () => {
    expect(resolveClipWindow(null, 30)).toEqual({ start: 0, end: 30 })
  })
})

describe('formatClock', () => {
  it.each([
    [0, 0, '0:00'],
    [5, 0, '0:05'],
    [90, 0, '1:30'],
    [3599, 0, '59:59'],
    [3661, 0, '1:01:01'],
  ])('formats %i seconds as %s', (seconds, guide, expected) => {
    expect(formatClock(seconds, guide)).toBe(expected)
  })

  // The guide is the window's own duration, so a short position inside a long window still
  // carries the hour field and the control row does not reflow when the hour digit arrives.
  it('shows the hour field when the guide passes an hour', () => {
    expect(formatClock(35, 3600)).toBe('0:00:35')
    expect(formatClock(35, 3599)).toBe('0:35')
  })

  // `length` is 0 until the media reports a duration, and `currentTime` can read NaN while the
  // engine is attaching. Neither may put `NaN:aN` in the control bar.
  it.each([
    [-1, '0:00'],
    [Number.NaN, '0:00'],
    [Number.POSITIVE_INFINITY, '0:00'],
  ])('answers 0:00 for %s', (seconds, expected) => {
    expect(formatClock(seconds)).toBe(expected)
  })
})

describe('holdInWindow', () => {
  const clip = { start: 5, end: 15 }

  it('leaves a video with no window alone', () => {
    expect(holdInWindow(null, 0)).toBeNull()
    expect(holdInWindow(null, 9_999)).toBeNull()
  })

  it('leaves playback inside the window alone', () => {
    expect(holdInWindow(clip, 5)).toBeNull()
    expect(holdInWindow(clip, 14.9)).toBeNull()
  })

  // Every way out of the window converges here: a drag, a hotkey, a gesture, or a position the
  // browser restored.
  it('seeks back to the start from before the window', () => {
    expect(holdInWindow(clip, 0)).toEqual({ kind: 'seek', time: 5 })
    expect(holdInWindow(clip, 4.99)).toEqual({ kind: 'seek', time: 5 })
  })

  it('pauses at the stop', () => {
    expect(holdInWindow(clip, 15)).toEqual({ kind: 'pause' })
    expect(holdInWindow(clip, 20)).toEqual({ kind: 'pause' })
  })

  it('never pauses a window with no stop', () => {
    expect(holdInWindow({ start: 5, end: null }, 9_999)).toBeNull()
  })
})

describe('replayFrom', () => {
  it('restarts a window that has run out', () => {
    expect(replayFrom({ start: 5, end: 15 }, 15)).toBe(5)
    // `timeupdate` lands up to ~250ms short of the stop, so the pause can leave playback just
    // inside the window. Pressing play there must still restart it, not pause again at once.
    expect(replayFrom({ start: 5, end: 15 }, 14.7)).toBe(5)
  })

  it('carries on from inside the window', () => {
    expect(replayFrom({ start: 5, end: 15 }, 8)).toBeNull()
  })

  it.each([
    ['a video with no window', null],
    ['a window with no stop', { start: 5, end: null }],
  ])('leaves %s alone', (_label, window) => {
    expect(replayFrom(window, 9_999)).toBeNull()
  })
})

describe('secondsToIsoDuration', () => {
  it.each([
    [0, 'PT0S'],
    [45, 'PT45S'],
    [90, 'PT1M30S'],
    [3661, 'PT1H1M1S'],
    [3600, 'PT1H0S'],
    [Number.NaN, 'PT0S'],
  ])('renders %s as %s', (seconds, expected) => {
    expect(secondsToIsoDuration(seconds)).toBe(expected)
  })
})

describe('percentSeek', () => {
  // The percent hotkeys seek by a share of the window, not of the media: `5` is halfway through it.
  it.each([
    ['0', 100],
    ['5', 150],
    ['9', 190],
    ['Home', 100],
    ['End', 200],
  ])('seeks %s to %i', (key, expected) => {
    expect(percentSeek(100, 100, key)).toBe(expected)
  })

  it.each([['k'], ['ArrowLeft'], ['']])('ignores %s', (key) => {
    expect(percentSeek(100, 100, key)).toBeNull()
  })
})

describe('bufferedPercent', () => {
  const window = { start: 100, end: 200 }

  // The ranges are absolute, so the share shown is measured from the window's own start.
  it.each([
    ['nothing buffered', [], 0],
    ['buffered short of the start', [[0, 80]] as [number, number][], 0],
    ['buffered to the middle', [[0, 150]] as [number, number][], 50],
    ['buffered to the end', [[0, 200]] as [number, number][], 100],
    ['buffered past the end', [[0, 900]] as [number, number][], 100],
    [
      'several ranges, the last one counting',
      [
        [0, 110],
        [140, 175],
      ] as [number, number][],
      75,
    ],
  ])('reports %s as %i%%', (_label, buffered, expected) => {
    expect(bufferedPercent(window, 100, buffered)).toBe(expected)
  })

  // `length` is 0 until the media reports a duration, which is the nothing-to-show state.
  it('reports nothing while the duration is unknown', () => {
    expect(bufferedPercent(window, 0, [[0, 900]])).toBe(0)
  })
})
