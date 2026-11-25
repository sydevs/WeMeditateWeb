/**
 * The visitor's own time of day, as the app's user choices name it.
 *
 * Pure: it is handed a zone and a clock. The zone is the visitor's, never the
 * host's — a Worker's clock is UTC, and resolving there would show a visitor in
 * Sydney whatever hour UTC is in. The server reads the zone from Cloudflare
 * (`server/content-index.ts`) and the browser re-reads its own after mount
 * (`useTimeOfDaySlot`), so the two agree on all but a misplaced guess.
 *
 * The boundaries are the app's, so a mood opens the same meditation on both
 * surfaces: `WeMeditateApp/lib/domain/meditation/utils/meditation_timing.dart`.
 * The upstream choices define a night slot and leave it empty on every one of
 * them, so night folds into evening until an editor fills them.
 */

/** The three slots a choice's `timings` can name and the site offers. */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening'

/** Every slot the site offers, in the order a day runs. */
export const ALL_TIMES_OF_DAY: readonly TimeOfDay[] = ['morning', 'afternoon', 'evening']

/**
 * The slot a wall-clock hour falls in: morning 3–11, afternoon 12–16,
 * evening 17–2.
 */
export function slotForHour(hour: number): TimeOfDay {
  if (hour >= 3 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'

  return 'evening'
}

/**
 * The slot it is in `timezone`, or `null` when the zone cannot be used.
 *
 * `null` is deliberately not a guess: `undefined` resolves against the host's
 * own clock, and an unknown zone string throws `RangeError` out of `Intl`. The
 * caller decides what an unusable zone shows — the picker keeps every mood's
 * tile, which is what the server already rendered.
 */
export function timeOfDaySlot(timezone: string | undefined, now: Date): TimeOfDay | null {
  if (typeof timezone !== 'string' || timezone.length === 0) {
    return null
  }

  try {
    const format = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: timezone,
    })
    const hour = Number(format.format(now))

    // `hourCycle: h23` is what `hour12: false` asks for, but some runtimes
    // answer `24` for midnight, which is hour 0.
    return Number.isFinite(hour) ? slotForHour(hour % 24) : null
  } catch {
    return null
  }
}
