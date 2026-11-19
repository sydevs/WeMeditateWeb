import { useEffect, useState } from 'react'
import { Button, Countdown } from '../../atoms'
import { useLocale } from '../../../hooks/usePageContext'
import { useT } from '../../../hooks/useT'
import {
  relativeToStart,
  sessionAt,
  sessionLineParts,
  type SessionSchedule,
} from '../../../lib/live-session'
import { isSafeHttpUrl } from '../../../lib/urls'

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
 * unconditional there: it is the only way in they are offered. An effect then
 * supplies the visitor's clock, and from that point the panel shows their local
 * time, a countdown, and the join action only while a session is under way.
 *
 * Every string is a finished one from `blocks.live_session`. The weekday, the
 * time and the zone name all come from `Intl`, which is the platform's own
 * label rather than a translation (AGENTS.md).
 */
export function LiveSession({ schedule }: LiveSessionProps) {
  const t = useT()
  const locale = useLocale()
  const [now, setNow] = useState<Date | null>(null)

  // `null` until the browser runs, so SSR and hydration render the same thing.
  useEffect(() => {
    // The visitor's clock does not exist until the browser runs, and the panel
    // has to render the class's own schedule before it. One extra render after
    // mount is the price of markup the server can produce.
    // eslint-disable-next-line @eslint-react/set-state-in-effect
    setNow(new Date())
  }, [])

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

  if (now === null) {
    const first = schedule.starts[0]

    if (first === undefined) return <Panel>{t('blocks.live_session.no_upcoming')}</Panel>

    const parts = sessionLineParts(new Date(first), locale, schedule.timeZone)

    return (
      <Panel>
        <p className="text-lg md:text-xl">{t('blocks.live_session.schedule_line', parts)}</p>
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
        announcement={t('blocks.live_session.a11y_next_session', {
          weekday: local.weekday,
          time: local.time,
          relative: relativeToStart(session.start, now, locale),
        })}
        initialRemainingMs={session.start.getTime() - now.getTime()}
        size="md"
        targetDate={session.start}
      />
    </Panel>
  )
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col items-center gap-4 text-fg">{children}</div>
}
