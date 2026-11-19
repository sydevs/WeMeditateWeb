import { describe, it, expect } from 'vitest'
import {
  countdownFigures,
  countdownTickMs,
  readSessionClass,
  relativeToStart,
  sessionAt,
  sessionEnd,
  sessionLineParts,
  type SessionSchedule,
} from './live-session'

/**
 * The English Tuesday class, in `Europe/London`, across the BST → GMT boundary
 * (2026-10-25). The fixture assumes the producer sends UTC instants that keep
 * the same local clock time either side of a transition, which is what
 * `rrule-temporal` expands a weekly recurrence to upstream
 * (`SahajCloud src/fields/scheduleFields.ts`).
 *
 * `Europe/Moscow` cannot stand in: it has had no DST since 2014, so the
 * Russian class would exercise none of this.
 */
const LONDON: SessionSchedule = {
  // 19:00 BST, then 19:00 GMT a week after the clocks go back.
  starts: ['2026-10-20T18:00:00.000Z', '2026-10-27T19:00:00.000Z'],
  timeZone: 'Europe/London',
  endTime: '20:30',
  joinUrl: 'https://example.invalid/room',
}

describe('sessionLineParts', () => {
  it('holds the local clock time across a DST boundary and changes the zone label', () => {
    const summer = sessionLineParts(new Date(LONDON.starts[0]!), 'en-GB', LONDON.timeZone)
    const winter = sessionLineParts(new Date(LONDON.starts[1]!), 'en-GB', LONDON.timeZone)

    expect(summer.time).toBe(winter.time)
    expect(summer.weekday).toBe('Tuesday')
    expect(summer.zone).not.toBe(winter.zone)
    expect(summer.zone).toMatch(/Summer/)
    expect(winter.zone).toMatch(/Greenwich/)
  })

  it("reads the browser's own zone when none is named", () => {
    // The browser re-renders with no `timeZone`, which is what upgrades the
    // line from the class's clock to the visitor's.
    const parts = sessionLineParts(new Date(LONDON.starts[0]!), 'en-GB')

    expect(parts.zone.length).toBeGreaterThan(0)
  })
})

describe('sessionEnd', () => {
  it('applies endTime to the start instant, on its own day in the class zone', () => {
    const end = sessionEnd(new Date(LONDON.starts[0]!), LONDON)

    // 19:00 → 20:30 is ninety minutes, whichever side of the transition.
    expect(end.getTime() - Date.parse(LONDON.starts[0]!)).toBe(90 * 60_000)
    expect(sessionEnd(new Date(LONDON.starts[1]!), LONDON).getTime()).toBe(
      Date.parse(LONDON.starts[1]!) + 90 * 60_000,
    )
  })

  it('falls back to an hour where endTime is absent, unparseable, or not after the start', () => {
    const hour = 60 * 60_000
    const start = new Date(LONDON.starts[0]!)

    for (const endTime of [null, 'half past eight', '18:00']) {
      expect(sessionEnd(start, { ...LONDON, endTime }).getTime()).toBe(start.getTime() + hour)
    }
  })
})

describe('readSessionClass', () => {
  const online = {
    eventType: 'online',
    onlineUrl: 'https://example.invalid/room',
    schedule: { firstDate_tz: 'Europe/London', endTime: '20:30', upcomingDates: LONDON.starts },
  }

  it('reads an online class', () => {
    const source = readSessionClass(online)

    expect(source).toEqual({ kind: 'schedule', schedule: LONDON })
  })

  it('drops a date the producer sent that is not one', () => {
    const source = readSessionClass({
      ...online,
      schedule: { ...online.schedule, upcomingDates: ['not a date', LONDON.starts[0]] },
    })

    expect(source.kind === 'schedule' && source.schedule.starts).toEqual([LONDON.starts[0]])
  })

  it.each([
    ['an editor who picked nothing', undefined, 'absent'],
    ['a null relationship', null, 'absent'],
    ['a bare id, which is an unpublished or trashed class', 1506, 'unresolved'],
    ['a class that is no longer online', { ...online, eventType: 'offline' }, 'not-online'],
    ['a dormant class', { ...online, inactive: true }, 'not-online'],
  ])('reports %s', (_label, event, reason) => {
    expect(readSessionClass(event)).toEqual({ kind: 'gap', reason })
  })
})

describe('sessionAt', () => {
  const at = (iso: string) => sessionAt(LONDON, new Date(iso))

  it('counts down to the next start', () => {
    const session = at('2026-10-19T12:00:00.000Z')

    expect(session.phase).toBe('upcoming')
    expect(session.phase !== 'none' && session.start.toISOString()).toBe(LONDON.starts[0])
  })

  it('is live from the start until the end', () => {
    expect(at('2026-10-20T18:00:00.000Z').phase).toBe('live')
    expect(at('2026-10-20T19:29:00.000Z').phase).toBe('live')
  })

  // What makes the panel roll on by itself: all ten instants are in the
  // browser, so the tick after a session ends already names the next one.
  it('moves to the next session once this one has ended', () => {
    const session = at('2026-10-20T19:31:00.000Z')

    expect(session.phase).toBe('upcoming')
    expect(session.phase !== 'none' && session.start.toISOString()).toBe(LONDON.starts[1])
  })

  it('has nothing to show once the class is over', () => {
    expect(at('2027-01-01T00:00:00.000Z')).toEqual({ phase: 'none' })
    expect(sessionAt({ ...LONDON, starts: [] }, new Date())).toEqual({ phase: 'none' })
  })
})

describe('relativeToStart', () => {
  const now = new Date('2026-10-20T12:00:00.000Z')

  it('names the largest unit that reads as at least one', () => {
    const phrase = (iso: string) => relativeToStart(new Date(iso), now, 'en-GB')

    expect(phrase('2026-10-22T12:00:00.000Z')).toMatch(/2 days/)
    expect(phrase('2026-10-20T15:00:00.000Z')).toMatch(/3 hours/)
    expect(phrase('2026-10-20T12:40:00.000Z')).toMatch(/40 minutes/)
  })
})

describe('countdownFigures', () => {
  it('carries whole days, so hours stay 0-23', () => {
    expect(countdownFigures(6 * 86_400_000 + 23 * 3_600_000 + 59 * 60_000 + 59_000)).toEqual({
      days: 6,
      hours: 23,
      minutes: 59,
      seconds: 59,
    })
  })

  it('never goes negative', () => {
    expect(countdownFigures(-5000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })
})

describe('countdownTickMs', () => {
  it('reaches seconds only inside the final hour', () => {
    expect(countdownTickMs(3_600_000, false)).toBe(1000)
    expect(countdownTickMs(3_600_001, false)).toBe(60_000)
  })

  it('never beats a minute for a visitor who asked for less motion', () => {
    expect(countdownTickMs(1000, true)).toBe(60_000)
  })
})
