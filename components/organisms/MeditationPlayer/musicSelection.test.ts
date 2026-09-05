import { describe, it, expect } from 'vitest'
import { pickRandomIndex, pickNextRandomIndex } from './musicSelection'

describe('pickRandomIndex', () => {
  it('returns 0 for empty or single-item lists', () => {
    expect(pickRandomIndex(0)).toBe(0)
    expect(pickRandomIndex(1)).toBe(0)
  })

  it('maps the rng value across the full range', () => {
    // rng just below each 1/length boundary selects the matching index.
    expect(pickRandomIndex(4, () => 0)).toBe(0)
    expect(pickRandomIndex(4, () => 0.26)).toBe(1)
    expect(pickRandomIndex(4, () => 0.51)).toBe(2)
    expect(pickRandomIndex(4, () => 0.99)).toBe(3)
  })

  it('stays within [0, length) for real Math.random', () => {
    for (let i = 0; i < 1000; i++) {
      const idx = pickRandomIndex(5)

      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(5)
    }
  })
})

describe('pickNextRandomIndex', () => {
  it('returns 0 for empty or single-item lists', () => {
    expect(pickNextRandomIndex(0, 0)).toBe(0)
    expect(pickNextRandomIndex(1, 0)).toBe(0)
  })

  it('never returns the current index when more than one track exists', () => {
    for (let length = 2; length <= 6; length++) {
      for (let current = 0; current < length; current++) {
        for (let i = 0; i < 200; i++) {
          const next = pickNextRandomIndex(length, current)

          expect(next).not.toBe(current)
          expect(next).toBeGreaterThanOrEqual(0)
          expect(next).toBeLessThan(length)
        }
      }
    }
  })

  it('skips past the current index deterministically', () => {
    // length 3, current 1 → candidates {0, 2}. Offsets {0, 1} map around current.
    expect(pickNextRandomIndex(3, 1, () => 0)).toBe(0)
    expect(pickNextRandomIndex(3, 1, () => 0.99)).toBe(2)
    // current 0 → offsets shift up to {1, 2}, never 0.
    expect(pickNextRandomIndex(3, 0, () => 0)).toBe(1)
    expect(pickNextRandomIndex(3, 0, () => 0.99)).toBe(2)
  })

  it('can reach every other index', () => {
    const seen = new Set<number>()

    for (let i = 0; i < 500; i++) {
      seen.add(pickNextRandomIndex(4, 2))
    }
    expect([...seen].sort()).toEqual([0, 1, 3])
  })
})
