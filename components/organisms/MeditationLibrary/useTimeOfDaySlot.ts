import { useEffect, useState } from 'react'
import { timeOfDaySlot, type TimeOfDay } from '@/lib/time-of-day'

/**
 * The visitor's own time of day, or `null` until the browser has told us.
 *
 * ⚠ **`null` on the first render is load-bearing, not a loading state.** The
 * zone is the browser's, so the server cannot know it: a Worker's clock is UTC,
 * and resolving there would show a visitor in Sydney whatever hour UTC is in.
 * The caller renders every slot's tiles while this is `null` — which is what
 * the server sent, so hydration matches — and narrows once it resolves.
 *
 * It stays `null` when `Intl` cannot answer, so an unusable zone keeps every
 * slot rather than guessing one.
 */
export function useTimeOfDaySlot(): TimeOfDay | null {
  const [slot, setSlot] = useState<TimeOfDay | null>(null)

  useEffect(() => {
    // eslint-disable-next-line @eslint-react/set-state-in-effect -- the zone exists only in the browser, so the server and the client would disagree on the markup if this ran any earlier
    setSlot(timeOfDaySlot(browserTimeZone(), new Date()))
  }, [])

  return slot
}

/** The browser's IANA zone, or `undefined` where `Intl` will not say. */
export function browserTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
  } catch {
    return undefined
  }
}
