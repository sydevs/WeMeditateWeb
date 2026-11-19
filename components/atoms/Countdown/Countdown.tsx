import { ComponentProps, useState, useEffect } from 'react'
import { countdownFigures, countdownTickMs, type CountdownFigures } from '../../../lib/live-session'
import { useT } from '../../../hooks/useT'

export interface CountdownProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Target date/time to count down to (ISO string or Date) */
  targetDate: string | Date
  /**
   * The time left when the server rendered, in milliseconds.
   *
   * ⚠ The atom never reads the clock during render. Seeding state from
   * `Date.now()` made the server and the first client render disagree, and
   * React discards the server's markup on a mismatch. The first client value is
   * written in the effect instead, which is also the first moment a tick is
   * due.
   */
  initialRemainingMs: number
  /**
   * One finished sentence giving the next session's day, time and how far away
   * it is, read by a screen reader in place of the digits.
   *
   * Finished, never assembled here: only the caller knows the key and the
   * language it is written in. It changes at most once a minute, because its
   * smallest unit is minutes — which is what keeps the live region quiet while
   * the digits tick.
   */
  announcement?: string
  /** Optional callback when countdown reaches zero */
  onComplete?: () => void
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

function remainingMsAt(targetDate: string | Date, now: number): number {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate

  return Math.max(0, target.getTime() - now)
}

/**
 * The time left, redrawn on the cadence `countdownTickMs` allows: whole
 * minutes until the final hour, then seconds, and never faster than a minute
 * for a visitor who asked for less motion.
 */
function useRemainingMs(
  targetDate: string | Date,
  initialRemainingMs: number,
  onComplete?: () => void,
): number {
  const [remaining, setRemaining] = useState(initialRemainingMs)

  useEffect(() => {
    const motion =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null
    let timer: ReturnType<typeof setTimeout> | undefined
    let completed = false

    // A self-rescheduling timeout rather than an interval: the cadence depends
    // on the time left, so the next delay is only known after a tick.
    const tick = () => {
      const next = remainingMsAt(targetDate, Date.now())

      setRemaining(next)

      if (next <= 0) {
        if (!completed) {
          completed = true
          onComplete?.()
        }

        return
      }

      timer = setTimeout(tick, countdownTickMs(next, motion?.matches === true))
    }

    // The first client value has to be written here: reading the clock during
    // render is what made the server and the browser disagree. The extra render
    // after mount is the price of a markup match, and it happens once.
    // eslint-disable-next-line @eslint-react/set-state-in-effect
    tick()

    const restart = () => {
      if (timer) clearTimeout(timer)
      tick()
    }

    motion?.addEventListener('change', restart)

    return () => {
      if (timer) clearTimeout(timer)
      motion?.removeEventListener('change', restart)
    }
  }, [targetDate, initialRemainingMs, onComplete])

  return remaining
}

/**
 * Countdown timer atom displaying days, hours, minutes, and seconds.
 * Uses Futura Book font for a clean, modern appearance.
 *
 * The days cell appears only once a session is a day or more away, so the
 * hours cell never has to carry a three-digit count.
 *
 * @example
 * <Countdown
 *   targetDate={new Date(Date.now() + 3600000)}
 *   initialRemainingMs={3600000}
 *   announcement="The next session is Tuesday at 7:00 pm, in 1 hour."
 * />
 */
export function Countdown({
  targetDate,
  initialRemainingMs,
  announcement,
  onComplete,
  size = 'lg',
  className = '',
  ...props
}: CountdownProps) {
  const t = useT()
  const figures = countdownFigures(useRemainingMs(targetDate, initialRemainingMs, onComplete))

  // Size variants
  const sizeClasses = {
    sm: {
      numbers: 'text-4xl md:text-5xl',
      labels: 'text-sm',
    },
    md: {
      numbers: 'text-5xl md:text-6xl',
      labels: 'text-base',
    },
    lg: {
      numbers: 'text-6xl md:text-8xl',
      labels: 'text-lg',
    },
  }

  const { numbers, labels } = sizeClasses[size]

  const cells: { key: keyof CountdownFigures; label: string }[] = [
    ...(figures.days >= 1 ? [{ key: 'days' as const, label: t('blocks.general.days') }] : []),
    { key: 'hours', label: t('blocks.general.hours') },
    { key: 'minutes', label: t('blocks.general.minutes') },
    { key: 'seconds', label: t('blocks.general.seconds') },
  ]

  return (
    <div className={`text-center text-fg ${className}`} {...props}>
      {/* The digits are decoration for assistive tech: the sentence below says
          the same thing once, and a reader re-reading six changing numbers
          every second says nothing anyone can follow. */}
      <div
        aria-hidden="true"
        className={`flex items-start justify-center gap-1 font-number ${numbers} font-light tracking-wide leading-none`}
      >
        {cells.map((cell, index) => (
          <div className="contents" key={cell.key}>
            {index > 0 && <span className="mt-0">:</span>}
            <div className="inline-flex flex-col items-center">
              <span className="tabular-nums">{String(figures[cell.key]).padStart(2, '0')}</span>
              <span className={`${labels} uppercase tracking-wide mt-0 font-number font-light`}>
                {cell.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* One polite region, carrying a sentence whose smallest unit is minutes.
          This is a component's own status, not a route change — the route
          announcer in `LayoutRoot` is a separate region (docs/rules/design-system.md). */}
      {announcement && (
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      )}
    </div>
  )
}
