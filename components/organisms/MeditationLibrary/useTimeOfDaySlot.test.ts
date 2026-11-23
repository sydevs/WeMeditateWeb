// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTimeOfDaySlot, browserTimeZone } from './useTimeOfDaySlot'

/**
 * Pins the clock and the zone the browser reports.
 *
 * ⚠ **`toFake: ['Date']` is load-bearing.** The default set includes
 * `Intl.DateTimeFormat`, which the fake timers replace wholesale — so a spy on
 * its prototype is silently bypassed and every zone reads as `UTC`, which still
 * passes any case whose expected slot happens to be UTC's.
 *
 * Only `resolvedOptions` is stubbed, never the constructor: `timeOfDaySlot`
 * formats the hour with a real `Intl.DateTimeFormat`, so replacing it would test
 * the stub rather than the zone arithmetic.
 */
function withZone(timeZone: string | undefined, iso: string) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(iso))
  vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
    timeZone,
  } as never)
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useTimeOfDaySlot', () => {
  it.each([
    // 2026-11-23T00:00Z is 11:00 in Sydney, 19:00 the previous day in Toronto,
    // and 05:30 in Kolkata — three zones, three different answers from one instant.
    ['Australia/Sydney', '2026-11-23T00:00:00Z', 'morning'],
    ['America/Toronto', '2026-11-23T00:00:00Z', 'evening'],
    ['Asia/Kolkata', '2026-11-23T00:00:00Z', 'morning'],
    ['Europe/London', '2026-11-23T14:00:00Z', 'afternoon'],
    // Midnight is hour 0, which some runtimes format as 24.
    ['Europe/London', '2026-11-23T00:00:00Z', 'evening'],
  ])('resolves %s at %s to %s', (zone, iso, expected) => {
    withZone(zone, iso)

    const { result } = renderHook(() => useTimeOfDaySlot())

    expect(result.current).toBe(expected)
  })

  it('stays null for a zone Intl will not name, so every slot is kept', () => {
    withZone(undefined, '2026-11-23T00:00:00Z')

    const { result } = renderHook(() => useTimeOfDaySlot())

    expect(result.current).toBeNull()
  })
})

describe('browserTimeZone', () => {
  it('answers undefined rather than throwing when Intl refuses', () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockImplementation(() => {
      throw new RangeError('no')
    })

    expect(browserTimeZone()).toBeUndefined()
  })
})
