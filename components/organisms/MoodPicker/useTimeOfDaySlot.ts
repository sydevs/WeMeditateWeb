import { useEffect, useState } from 'react'
import { timeOfDaySlot, type TimeOfDay } from '@/lib/time-of-day'

/**
 * The visitor's own time of day, or `null` until the browser has told us.
 *
 * ⚠ **`null` on the first render is load-bearing, not a loading state.** The
 * server resolved a slot from Cloudflare's view of the visitor's zone, and that
 * is what the HTML carries — so this must answer `null` on the render that
 * hydrates it, or the two disagree on the markup. It then confirms the server's
 * guess, and the picker swaps only where the two differ.
 *
 * It stays `null` when `Intl` cannot answer, which leaves the server's slot
 * standing rather than replacing it with a guess.
 */
export function useTimeOfDaySlot(): TimeOfDay | null {
  const [slot, setSlot] = useState<TimeOfDay | null>(null)

  useEffect(() => {
    // eslint-disable-next-line @eslint-react/set-state-in-effect -- the zone exists only in the browser, so running this any earlier would make the server and the client render different markup
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
