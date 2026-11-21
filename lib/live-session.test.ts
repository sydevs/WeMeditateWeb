import { describe, it, expect } from 'vitest'
import {
  readSessionClass,
  relativeToStart,
  sessionAt,
  sessionLineParts,
  sessionTickMs,
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

describe('the join window', () => {
  // `sessionEnd` is internal: `sessionAt` is what decides the window, and it
  // hands the end back, so the rule is asserted where it is used.
  const windowOf = (schedule: SessionSchedule, iso: string) => {
    const session = sessionAt(schedule, new Date(iso))

    if (session.phase === 'none') throw new Error('no session to measure')

    return session.end.getTime() - session.start.getTime()
  }

  it('runs from the start to endTime on its own day in the class zone', () => {
    // 19:00 to 20:30 is ninety minutes, whichever side of the transition.
    expect(windowOf(LONDON, '2026-10-19T12:00:00.000Z')).toBe(90 * 60_000)
    expect(windowOf(LONDON, '2026-10-21T12:00:00.000Z')).toBe(90 * 60_000)
  })

  it('falls back to an hour where endTime is absent, unparseable, or not after the start', () => {
    for (const endTime of [null, 'half past eight', '18:00']) {
      expect(windowOf({ ...LONDON, endTime }, '2026-10-19T12:00:00.000Z')).toBe(60 * 60_000)
    }
  })

  // Verified against the real transition rather than reasoned about: the naive
  // `start + (endMinutes - startMinutes)` ended a two-hour class one real hour
  // in, so "Happening now" and the join button vanished mid-session.
  it('holds its length through a transition that falls inside it', () => {
    const newYork: SessionSchedule = {
      // 01:00 EDT on the morning the clocks go back; 02:00 is an hour of real time away.
      starts: ['2026-11-01T05:00:00.000Z'],
      timeZone: 'America/New_York',
      endTime: '02:00',
      joinUrl: null,
    }

    expect(windowOf(newYork, '2026-11-01T04:00:00.000Z')).toBe(2 * 60 * 60_000)
  })
})

describe('readSessionClass', () => {
  const online = {
    eventType: 'online',
    onlineUrl: 'https://example.invalid/room',
    schedule: { firstDate_tz: 'Europe/London', endTime: '20:30', upcomingDates: LONDON.starts },
  }

  it('sorts the instants rather than trusting them to arrive in order', () => {
    // An exclusion or a merged rule could leave the next session behind a
    // later one, and then the page would advertise the wrong date.
    const source = readSessionClass({
      ...online,
      schedule: { ...online.schedule, upcomingDates: [...LONDON.starts].reverse() },
    })

    expect(source.kind === 'schedule' && source.schedule.starts).toEqual(LONDON.starts)
  })

  it('degrades a zone the platform does not know, rather than throwing on render', () => {
    // `sessionLineParts` runs on the server-render path, and `Intl` throws on a
    // zone it does not know — which would be a 500 where the rule is to degrade.
    const source = readSessionClass({
      ...online,
      schedule: { ...online.schedule, firstDate_tz: '' },
    })

    expect(source.kind === 'schedule' && source.schedule.timeZone).toBe('UTC')

    // The boundary is the single guard: `sessionLineParts` is only ever handed
    // a zone that came back from here, or none at all.
    expect(() =>
      sessionLineParts(
        new Date(LONDON.starts[0]!),
        'en-GB',
        (source.kind === 'schedule' && source.schedule.timeZone) || undefined,
      ),
    ).not.toThrow()
  })

  it('ignores endTime where the class states no zone to read it in', () => {
    // `endTime` is a wall clock in the class's own zone. Derived against UTC it
    // made a 19:00 New York class read as twenty hours long.
    const source = readSessionClass({
      ...online,
      schedule: { ...online.schedule, firstDate_tz: null },
    })

    expect(source.kind === 'schedule' && source.schedule.endTime).toBeNull()
  })

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

describe('sessionTickMs', () => {
  const upcoming = (minutes: number) =>
    sessionAt(
      { ...LONDON, starts: [new Date(Date.UTC(2026, 9, 20, 12) + minutes * 60_000).toISOString()] },
      new Date(Date.UTC(2026, 9, 20, 12)),
    )

  const now = new Date(Date.UTC(2026, 9, 20, 12))

  it('reaches seconds only inside the final hour', () => {
    expect(sessionTickMs(upcoming(60), now, false)).toBe(1000)
    expect(sessionTickMs(upcoming(61), now, false)).toBe(60_000)
  })

  it('never beats a minute for a visitor who asked for less motion', () => {
    expect(sessionTickMs(upcoming(10), now, true)).toBe(60_000)
  })

  it('wakes once a minute while a session is under way, only to notice its end', () => {
    expect(sessionTickMs(sessionAt(LONDON, new Date('2026-10-20T18:10:00.000Z')), now, false)).toBe(
      60_000,
    )
  })

  it('stops the timer once nothing will change again', () => {
    expect(sessionTickMs({ phase: 'none' }, now, false)).toBeNull()
  })
})
