import { describe, it, expect } from 'vitest'
import { slotForHour, timeOfDaySlot, type TimeOfDay } from './time-of-day'

/**
 * One instant, read in several zones. 2026-06-15T12:00:00Z is deliberately
 * mid-June: every zone below is then at a fixed offset, so the expected hour
 * is arithmetic rather than a guess about a DST boundary.
 */
const INSTANT = new Date('2026-06-15T12:00:00Z')

describe('slotForHour', () => {
  const cases: Array<[number, TimeOfDay]> = [
    [5, 'morning'],
    [11, 'morning'],
    [12, 'afternoon'],
    [16, 'afternoon'],
    [17, 'evening'],
    [23, 'evening'],
    // Night folds into evening: the categories leave the night slot empty.
    [0, 'evening'],
    [3, 'evening'],
    [4, 'evening'],
  ]

  it.each(cases)('reads hour %i as %s', (hour, expected) => {
    expect(slotForHour(hour)).toBe(expected)
  })
})

describe('timeOfDaySlot', () => {
  it.each([
    // 12:00 UTC is 22:00 in Sydney, 08:00 in Chicago, 05:00 in Los Angeles.
    ['Australia/Sydney', 'evening'],
    ['America/Chicago', 'morning'],
    ['America/Los_Angeles', 'morning'],
    ['Europe/Berlin', 'afternoon'],
    ['UTC', 'afternoon'],
  ] as Array<[string, TimeOfDay]>)('reads %s as %s at the same instant', (zone, expected) => {
    expect(timeOfDaySlot(zone, INSTANT)).toBe(expected)
  })

  it('shows the evening moods at 3am rather than nothing', () => {
    // 18:00 UTC is 03:00 the next day in Tokyo.
    expect(timeOfDaySlot('Asia/Tokyo', new Date('2026-06-15T18:00:00Z'))).toBe('evening')
  })

  it('reads midnight as evening, whichever hour the runtime names it', () => {
    // 15:00 UTC is 00:00 the next day in Tokyo.
    expect(timeOfDaySlot('Asia/Tokyo', new Date('2026-06-15T15:00:00Z'))).toBe('evening')
  })

  it('returns null for an absent zone rather than reading the Worker clock', () => {
    expect(timeOfDaySlot(undefined, INSTANT)).toBeNull()
    expect(timeOfDaySlot('', INSTANT)).toBeNull()
  })

  it('returns null for an unusable zone, and throws nothing', () => {
    expect(() => timeOfDaySlot('Not/AZone', INSTANT)).not.toThrow()
    expect(timeOfDaySlot('Not/AZone', INSTANT)).toBeNull()
  })
})
