/**
 * What a `splash` `countdown` block shows, derived from the online class an
 * editor pointed it at.
 *
 * Pure and env-free, as `lib/atlas-route.ts` is, so the Worker and the browser
 * run the same code: the Worker renders the class's own schedule in words, and
 * the browser re-renders it in the visitor's clock and ticks. Nothing here
 * reads the clock itself — every function takes `now` — so a render is
 * reproducible and a test needs no fake timers.
 *
 * **The producer computes, this formats.** `schedule.upcomingDates` is ten UTC
 * instants SahajCloud expands from the recurrence, six months out, exclusions
 * applied and DST resolved by `rrule-temporal`. All ten are sent to the
 * browser, which re-picks on every tick — which is what makes the panel change
 * state within a minute of a session starting, and roll on to the next one
 * after it ends, with no second read.
 *
 * ⚠ **Nothing here caches, and nothing should.** "A coordinator's correction
 * reaches the page within ten minutes" comes from the Cloudflare edge's 600s
 * cache in front of SahajCloud (`server/CACHING.md`). A cache added here would
 * sit behind that one and make the wait unbounded.
 *
 * **No date library.** Five were weighed at 19–22 kB gzip on a path every page
 * pays, and `Temporal` is not Baseline. `Intl` answers every question asked
 * here.
 */

import { isPopulated } from './payload-relationships'

/** The columns a countdown reads off the class it names. */
export interface SessionClass {
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
export type SessionPhase =
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
 * The wall-clock parts of an instant in one zone, as numbers.
 *
 * `Intl` is the only zone database in the platform, so reading an instant's
 * local hour means formatting it and parsing the parts back.
 */
function zonedParts(instant: Date, timeZone: string): { hour: number; minute: number } | null {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
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
export function sessionEnd(start: Date, schedule: SessionSchedule): Date {
  const hour = DEFAULT_SESSION_MINUTES * 60_000
  const endMinutes = schedule.endTime ? minutesOfDay(schedule.endTime) : null

  if (endMinutes === null) return new Date(start.getTime() + hour)

  const local = zonedParts(start, schedule.timeZone)

  if (!local) return new Date(start.getTime() + hour)

  const startMinutes = local.hour * 60 + local.minute

  if (endMinutes <= startMinutes) return new Date(start.getTime() + hour)

  return new Date(start.getTime() + (endMinutes - startMinutes) * 60_000)
}

/** Reads the class a `countdown` block names, saying why when there is none. */
export function readSessionClass(event: unknown): SessionSource {
  if (event === null || event === undefined) return { kind: 'gap', reason: 'absent' }

  // A bare id is an unpublished or trashed class (`server/AGENTS.md`).
  if (!isPopulated<SessionClass>(event)) return { kind: 'gap', reason: 'unresolved' }

  if (event.eventType !== 'online' || event.inactive === true) {
    return { kind: 'gap', reason: 'not-online' }
  }

  const starts = (event.schedule?.upcomingDates ?? []).filter(
    (value): value is string => typeof value === 'string' && !Number.isNaN(Date.parse(value)),
  )

  return {
    kind: 'schedule',
    schedule: {
      starts,
      timeZone: event.schedule?.firstDate_tz ?? 'UTC',
      endTime: event.schedule?.endTime ?? null,
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
export type SessionLineParts = {
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
  const weekday = new Intl.DateTimeFormat(locale, { ...base, weekday: 'long' }).format(start)
  const time = new Intl.DateTimeFormat(locale, {
    ...base,
    hour: 'numeric',
    minute: '2-digit',
  }).format(start)
  const zone =
    new Intl.DateTimeFormat(locale, { ...base, timeZoneName: 'long' })
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
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const difference = start.getTime() - now.getTime()

  if (Math.abs(difference) >= DAY) return format.format(Math.round(difference / DAY), 'day')
  if (Math.abs(difference) >= HOUR) return format.format(Math.round(difference / HOUR), 'hour')

  return format.format(Math.round(difference / MINUTE), 'minute')
}

/** A countdown's figures. `hours` stays 0–23 once `days` carries the rest. */
export interface CountdownFigures {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/** Splits the time left into days, hours, minutes and seconds. Never negative. */
export function countdownFigures(msRemaining: number): CountdownFigures {
  const remaining = Math.max(0, msRemaining)

  return {
    days: Math.floor(remaining / DAY),
    hours: Math.floor((remaining % DAY) / HOUR),
    minutes: Math.floor((remaining % HOUR) / MINUTE),
    seconds: Math.floor((remaining % MINUTE) / 1000),
  }
}

/**
 * How often the countdown may redraw: whole minutes until the final hour, then
 * seconds — and never faster than a minute for a visitor who asked for less
 * motion.
 */
export function countdownTickMs(msRemaining: number, reducedMotion: boolean): number {
  if (reducedMotion) return MINUTE

  return msRemaining <= HOUR ? 1000 : MINUTE
}
