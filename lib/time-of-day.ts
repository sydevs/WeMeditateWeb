/**
 * The visitor's own time of day, as the mood finder's categories name it.
 *
 * The upstream categories define a night slot and leave it empty on all 24
 * moods, so night folds into evening until an editor fills them.
 */

/** The three slots a featured mood's `timings` can name and the site offers. */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening'

/**
 * The slot a wall-clock hour falls in: morning 5–11, afternoon 12–16,
 * evening 17–4.
 */
export function slotForHour(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'

  return 'evening'
}

/**
 * The slot it is in `timezone`, or `null` when the zone cannot be used.
 *
 * `null` is deliberately not a guess. `undefined` would resolve against the
 * Worker's own clock, which is UTC, and silently show a visitor in Sydney the
 * moods of whoever happens to share UTC's hour. An unknown zone string throws
 * `RangeError` out of `Intl`, which must not reach `data()`; the caller
 * decides what an unusable zone renders.
 */
export function timeOfDaySlot(timezone: string | undefined, now: Date): TimeOfDay | null {
  if (typeof timezone !== 'string' || timezone.length === 0) {
    return null
  }

  try {
    const hour = Number(hourFormat(timezone).format(now))

    // `hourCycle: h23` is what `hour12: false` asks for, but some runtimes
    // answer `24` for midnight, which is hour 0.
    return Number.isFinite(hour) ? slotForHour(hour % 24) : null
  } catch {
    return null
  }
}

/**
 * One formatter per zone.
 *
 * An `Intl` constructor is among the most expensive calls in a Worker isolate
 * (`lib/i18n/i18n.ts` says the same of `Intl.PluralRules`), and this runs on every
 * render that carries the finder. The map is keyed only after the constructor
 * accepted the zone, so its key space is the IANA list and cannot grow past it.
 */
const HOUR_FORMATS = new Map<string, Intl.DateTimeFormat>()

function hourFormat(timezone: string): Intl.DateTimeFormat {
  const existing = HOUR_FORMATS.get(timezone)

  if (existing) return existing

  const format = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: timezone,
  })

  HOUR_FORMATS.set(timezone, format)

  return format
}
