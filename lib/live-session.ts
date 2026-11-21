/**
 * What a `splash` `countdown` block shows, derived from the online class an
 * editor pointed it at.
 *
 * Pure and env-free, as `lib/atlas-route.ts` is, so the Worker and the browser
 * run the same code. **Nothing here reads the clock** — every function takes
 * `now` — so a render is reproducible and no test needs fake timers.
 *
 * **The producer computes, this formats.** `schedule.upcomingDates` is ten UTC
 * instants SahajCloud expands from the recurrence, exclusions applied and DST
 * resolved upstream. All ten reach the browser, which re-picks on every tick,
 * so the panel changes state as a session starts and rolls on to the next one
 * after it ends with no second read.
 *
 * ⚠ **Nothing here caches a read, and nothing should.** A correction reaches
 * the page within ten minutes because the Cloudflare edge in front of
 * SahajCloud holds a read for 600s (`server/CACHING.md`). A cache added here
 * would sit behind that one and make the wait unbounded.
 *
 * **No date library.** `Intl` answers every question asked here, and the five
 * candidates weighed 19–22 kB gzip on a path every page pays.
 */

import { isPopulated } from './payload-relationships'

/** The columns a countdown reads off the class it names. */
interface SessionClass {
  onlineUrl?: string | null
  eventType?: ('offline' | 'online') | null
  inactive?: boolean | null
  schedule?: {
    firstDate_tz?: string | null
    endTime?: string | null
    upcomingDates?: string[] | null
  } | null
}

/**
 * Why a block has no class to count down to. Each is a different thing to say
 * to Sentry: an editor who picked nothing is not a data gap, and a class that
 * stopped being online is.
 */
export type SessionGap = 'absent' | 'unresolved' | 'not-online'

/** What the block renders from, once the class has been read. */
export type SessionSource =
  { kind: 'schedule'; schedule: SessionSchedule } | { kind: 'gap'; reason: SessionGap }

export interface SessionSchedule {
  /** The producer's future starts, ISO instants, ascending. */
  starts: string[]
  /** The class's own zone — the one the no-JavaScript line is written in. */
  timeZone: string
  /** `HH:MM` in that zone, or null for the hour-long default. */
  endTime: string | null
  /** The joining link, unchecked here: a scheme gate is the call site's. */
  joinUrl: string | null
}

/** Where a session stands against `now`. */
type SessionPhase =
  | { phase: 'none' }
  | { phase: 'upcoming'; start: Date; end: Date }
  | { phase: 'live'; start: Date; end: Date }

/** Minutes past midnight for an `HH:MM` string, or null when it is not one. */
function minutesOfDay(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())

  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (hours > 23 || minutes > 59) return null

  return hours * 60 + minutes
}

/**
 * Formatters, memoized on their own arguments.
 *
 * Constructing one resolves locale data, which is the expensive half of `Intl`;
 * formatting with it is cheap, and the object is immutable. `sessionAt` asks
 * the same zone question of up to ten instants and the panel re-renders on
 * every tick, so without this a second inside the final hour builds a dozen.
 * The keys are a locale and a class's own zone, both of which the content
 * bounds — and the cap is there because every other per-isolate memo here has
 * one, not because a page can reach it.
 */
const MAX_FORMATTERS = 64

const formatters = new Map<string, Intl.DateTimeFormat | Intl.RelativeTimeFormat>()

function memoized<T extends Intl.DateTimeFormat | Intl.RelativeTimeFormat>(
  key: string,
  build: () => T,
): T {
  const found = formatters.get(key)

  if (found) return found as T

  if (formatters.size >= MAX_FORMATTERS) formatters.clear()

  const built = build()

  formatters.set(key, built)

  return built
}

function formatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return memoized(
    `d|${locale}|${JSON.stringify(options)}`,
    () => new Intl.DateTimeFormat(locale, options),
  )
}

/** True for a zone `Intl` knows. An unknown one throws rather than degrading. */
function isKnownTimeZone(timeZone: string): boolean {
  try {
    formatter('en-GB', { timeZone })

    return true
  } catch {
    return false
  }
}

/**
 * The wall-clock parts of an instant in one zone, as numbers.
 *
 * `Intl` is the only zone database in the platform, so reading an instant's
 * local hour means formatting it and parsing the parts back. A `firstDate_tz`
 * the platform does not know throws, and answers `null`.
 */
function zonedParts(instant: Date, timeZone: string): { hour: number; minute: number } | null {
  try {
    const parts = formatter('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(instant)
    const hour = parts.find((part) => part.type === 'hour')?.value
    const minute = parts.find((part) => part.type === 'minute')?.value

    if (hour === undefined || minute === undefined) return null

    return { hour: Number(hour), minute: Number(minute) }
  } catch {
    return null
  }
}

/** An hour, the fallback length of a session with no usable `endTime`. */
const DEFAULT_SESSION_MINUTES = 60

/**
 * When a session that starts at `start` ends.
 *
 * The producer's own rule, mirrored rather than reinvented: `endTime` applied
 * to the start instant's own day in the class's zone, falling back to an hour
 * where it is absent or unparseable (SahajCloud `AppCardViewSchedule`).
 *
 * `shortcut: a session whose endTime is at or before its start is treated as an
 * hour long, because neither of the two live classes runs past midnight in its
 * own city. Give it a real end when one does.`
 */
function sessionEnd(start: Date, schedule: SessionSchedule): Date {
  const hour = DEFAULT_SESSION_MINUTES * 60_000
  const endMinutes = schedule.endTime ? minutesOfDay(schedule.endTime) : null

  if (endMinutes === null) return new Date(start.getTime() + hour)

  const local = zonedParts(start, schedule.timeZone)

  if (!local) return new Date(start.getTime() + hour)

  const startMinutes = local.hour * 60 + local.minute

  if (endMinutes <= startMinutes) return new Date(start.getTime() + hour)

  const candidate = new Date(start.getTime() + (endMinutes - startMinutes) * 60_000)
  const landed = zonedParts(candidate, schedule.timeZone)

  if (!landed) return candidate

  // A transition inside the session moves the zone's offset under us, so the
  // wall clock the candidate lands on is an hour off what `endTime` asked for.
  // Correcting by that difference is what keeps a two-hour class live for two
  // hours on the day the clocks change.
  const drift = endMinutes - (landed.hour * 60 + landed.minute)

  return drift === 0 ? candidate : new Date(candidate.getTime() + drift * 60_000)
}

/** Reads the class a `countdown` block names, saying why when there is none. */
export function readSessionClass(event: unknown): SessionSource {
  if (event === null || event === undefined) return { kind: 'gap', reason: 'absent' }

  // A bare id is an unpublished or trashed class (`server/AGENTS.md`).
  if (!isPopulated<SessionClass>(event)) return { kind: 'gap', reason: 'unresolved' }

  if (event.eventType !== 'online' || event.inactive === true) {
    return { kind: 'gap', reason: 'not-online' }
  }

  // Sorted, rather than trusted to arrive so: the producer expands one
  // recurrence in order, but an exclusion or a merged rule could leave the
  // next session behind a later one, and then the page would advertise the
  // wrong date.
  const starts = (event.schedule?.upcomingDates ?? [])
    .filter(
      (value): value is string => typeof value === 'string' && !Number.isNaN(Date.parse(value)),
    )
    .sort((left, right) => Date.parse(left) - Date.parse(right))

  // ⚠ A zone is validated here, once, because `sessionLineParts` runs on the
  // server-render path and `Intl` throws on a zone it does not know — which
  // would be a 500 where the rule is to degrade (`server/AGENTS.md`).
  const stated = event.schedule?.firstDate_tz
  const timeZone = stated && isKnownTimeZone(stated) ? stated : null

  return {
    kind: 'schedule',
    schedule: {
      starts,
      timeZone: timeZone ?? 'UTC',
      // `endTime` is a wall clock in the class's own zone, so it means nothing
      // without one. The hour-long default is the honest answer there, rather
      // than a window derived against UTC — which made a 19:00 New York class
      // read as twenty hours long.
      endTime: timeZone ? (event.schedule?.endTime ?? null) : null,
      joinUrl: event.onlineUrl ?? null,
    },
  }
}

/**
 * The session to show at `now`: the first whose end is still ahead, live once
 * its start has passed.
 */
export function sessionAt(schedule: SessionSchedule, now: Date): SessionPhase {
  for (const value of schedule.starts) {
    const start = new Date(value)
    const end = sessionEnd(start, schedule)

    if (end.getTime() <= now.getTime()) continue

    return start.getTime() <= now.getTime()
      ? { phase: 'live', start, end }
      : { phase: 'upcoming', start, end }
  }

  return { phase: 'none' }
}

/** The pieces `blocks.live_session.schedule_line` interpolates. */
type SessionLineParts = {
  weekday: string
  time: string
  /** The platform's own name for the zone — never a hand-built city name. */
  zone: string
}

/**
 * The session's day, time and zone, written in one zone.
 *
 * `timeZone` omitted means the visitor's own, which is what the browser
 * re-renders with once it runs.
 */
export function sessionLineParts(start: Date, locale: string, timeZone?: string): SessionLineParts {
  const base: Intl.DateTimeFormatOptions = timeZone ? { timeZone } : {}
  const weekday = formatter(locale, { ...base, weekday: 'long' }).format(start)
  const time = formatter(locale, { ...base, hour: 'numeric', minute: '2-digit' }).format(start)
  const zone =
    formatter(locale, { ...base, timeZoneName: 'long' })
      .formatToParts(start)
      .find((part) => part.type === 'timeZoneName')?.value ?? ''

  return { weekday, time, zone }
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * How far away a session is, in the largest unit that reads as at least one —
 * "in 2 days", "in 40 minutes". `Intl.RelativeTimeFormat` writes the sentence,
 * so no English is composed here.
 */
export function relativeToStart(start: Date, now: Date, locale: string): string {
  const format = memoized(
    `r|${locale}`,
    () => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }),
  )
  const difference = start.getTime() - now.getTime()

  if (Math.abs(difference) >= DAY) return format.format(Math.round(difference / DAY), 'day')
  if (Math.abs(difference) >= HOUR) return format.format(Math.round(difference / HOUR), 'hour')

  return format.format(Math.round(difference / MINUTE), 'minute')
}

/**
 * How long until the panel may redraw, or `null` once nothing will change
 * again.
 *
 * Whole minutes until the final hour, then seconds — and never faster than a
 * minute for a visitor who asked for less motion. A session under way needs
 * only to notice its own end, and a class with nothing left never changes, so
 * it stops the timer rather than waking to re-decide.
 */
export function sessionTickMs(
  session: SessionPhase,
  now: Date,
  reducedMotion: boolean,
): number | null {
  if (session.phase === 'none') return null
  if (reducedMotion || session.phase === 'live') return MINUTE

  return session.start.getTime() - now.getTime() <= HOUR ? 1000 : MINUTE
}
