import { useEffect, useState, type ReactNode } from 'react'
import { Button, Countdown } from '@/components/atoms'
import { useLocale } from '@/hooks/usePageContext'
import { useT } from '@/hooks/useT'
import {
  relativeToStart,
  sessionAt,
  sessionLineParts,
  sessionTickMs,
  type SessionSchedule,
} from '@/lib/content/live-session'
import { isSafeHttpUrl } from '@/lib/urls/urls'

export interface LiveSessionProps {
  /** The class's future starts, its own zone, and its joining link. */
  schedule: SessionSchedule
}

/**
 * The live-meditation panel: when the next online class starts, how long until
 * it does, and the way in once it has.
 *
 * **It server-renders, and the server has no visitor's clock.** So the first
 * render — the server's, and the browser's first, which must match it byte for
 * byte — is the class's own schedule in its own zone, plus its joining link.
 * That is what a visitor without JavaScript keeps, and it is why the link is
 * unconditional there: it is the only way in they are offered. A timer then
 * supplies the visitor's clock, and the panel shows their local time, a
 * countdown, and the join action only while a session is under way.
 *
 * **This component owns the only clock.** It re-picks from the ten instants on
 * every tick, which is what makes the panel change state as a session starts
 * and roll on to the next one after it ends with no second read. `Countdown`
 * is presentational, so nothing below here reads the time twice.
 *
 * Every string is a finished one from `blocks.live_session`. The weekday, the
 * time and the zone name all come from `Intl`, which is the platform's own
 * label rather than a translation (AGENTS.md).
 */
export function LiveSession({ schedule }: LiveSessionProps) {
  const t = useT()
  const locale = useLocale()
  const { now, tickMs } = useSessionClock(schedule)

  const joinUrl = schedule.joinUrl
  // Gated here, not left to `Link`: a joining link that goes nowhere is worse
  // as inert words than as no button at all (AGENTS.md). An online room's link
  // is absolute, so `isSafeHttpUrl` is the right one of the three.
  const joinButton =
    joinUrl && isSafeHttpUrl(joinUrl) ? (
      <Button external href={joinUrl} variant="primary">
        {t('blocks.live_session.join_now')}
      </Button>
    ) : null

  const first = schedule.starts[0]

  // A class with nothing left says so whatever the clock reads, so this answer
  // needs no `now` and is the same on the server and in the browser.
  if (first === undefined) return <Panel>{t('blocks.live_session.no_upcoming')}</Panel>

  if (now === null) {
    const own = sessionLineParts(new Date(first), locale, schedule.timeZone)

    return (
      <Panel>
        {/* ⚠ `suppressHydrationWarning`, because this one line is built from
            CLDR data on two independent ICU builds — the Worker's and the
            visitor's browser. A release that moves a zone's long name, or the
            space before `am`, differs by an invisible character, and React
            would throw the whole subtree's markup away over it. The browser
            replaces this line with the visitor's own clock a tick later
            anyway. */}
        <p suppressHydrationWarning className="text-lg md:text-xl">
          {t('blocks.live_session.schedule_line', own)}
        </p>
        {joinButton}
      </Panel>
    )
  }

  const session = sessionAt(schedule, now)

  if (session.phase === 'none') return <Panel>{t('blocks.live_session.no_upcoming')}</Panel>

  if (session.phase === 'live') {
    return (
      <Panel>
        <p className="text-lg md:text-xl">{t('blocks.live_session.live_now')}</p>
        {joinButton}
      </Panel>
    )
  }

  const local = sessionLineParts(session.start, locale)

  return (
    <Panel>
      <p className="text-sm uppercase tracking-wide">{t('blocks.live_session.next_session')}</p>
      <p className="text-lg md:text-xl">{t('blocks.live_session.schedule_line', local)}</p>
      <p className="text-sm uppercase tracking-wide">{t('blocks.live_session.starts_in')}</p>
      <Countdown
        announcement={t('blocks.a11y.next_session', {
          weekday: local.weekday,
          time: local.time,
          relative: relativeToStart(session.start, now, locale),
        })}
        remainingMs={session.start.getTime() - now.getTime()}
        // Seconds only while the panel is redrawing every second.
        showSeconds={tickMs === 1000}
        size="md"
      />
    </Panel>
  )
}

/**
 * The visitor's clock: `null` until the browser runs, then redrawn on the
 * cadence the session itself allows, and stopped once nothing will change.
 *
 * The motion preference is read on every tick rather than listened for: a
 * visitor who turns it on mid-countdown waits at most one more second for it
 * to take effect, which is cheaper than a listener and a restart.
 */
function useSessionClock(schedule: SessionSchedule): {
  now: Date | null
  tickMs: number | null
} {
  const [clock, setClock] = useState<{ now: Date | null; tickMs: number | null }>({
    now: null,
    tickMs: null,
  })

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    const tick = () => {
      const current = new Date()
      const reducedMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const next = sessionTickMs(sessionAt(schedule, current), current, reducedMotion)

      setClock({ now: current, tickMs: next })

      if (next !== null) timer = setTimeout(tick, next)
    }

    // The visitor's clock does not exist until the browser runs, and the panel
    // has to render the class's own schedule before it. One extra render after
    // mount is the price of markup the server can produce.
    // eslint-disable-next-line @eslint-react/set-state-in-effect
    tick()

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [schedule])

  return clock
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="flex flex-col items-center gap-4 text-fg">{children}</div>
}
