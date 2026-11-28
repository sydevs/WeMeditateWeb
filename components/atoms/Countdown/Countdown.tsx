import { ComponentProps, Fragment } from 'react'
import { useT } from '@/hooks/useT'

export interface CountdownProps extends Omit<ComponentProps<'div'>, 'children'> {
  /**
   * The time left, in milliseconds.
   *
   * ⚠ **The atom reads no clock, and holds no timer.** It used to seed state
   * from a live `Date.now()` during render, so the server and the first client
   * render disagreed and React threw the server's markup away. Whoever decides
   * what the panel shows owns the clock and redraws this — `LiveSession` does,
   * on the cadence `sessionTickMs` allows.
   */
  remainingMs: number
  /**
   * One finished sentence giving the next session's day, time and how far away
   * it is, read by a screen reader in place of the digits.
   *
   * Finished, never assembled here: only the caller knows the key and the
   * language it is written in. Its smallest unit is minutes, which is what
   * keeps the live region quiet while the digits tick.
   */
  announcement?: string
  /**
   * Whether to draw the seconds cell.
   *
   * ⚠ **A cell nobody redraws reads as a broken widget.** Outside the final
   * hour the panel redraws once a minute, so a seconds figure would sit frozen
   * and be wrong by up to 59 of every 60 seconds. Whoever owns the clock knows
   * the cadence, so it says.
   * @default true
   */
  showSeconds?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: { numbers: 'text-4xl md:text-5xl', labels: 'text-sm' },
  md: { numbers: 'text-5xl md:text-6xl', labels: 'text-base' },
  lg: { numbers: 'text-6xl md:text-8xl', labels: 'text-lg' },
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Days, hours, minutes and seconds left. Never negative, and `hours` stays 0–23. */
function figuresOf(remainingMs: number) {
  const left = Math.max(0, remainingMs)

  return {
    days: Math.floor(left / DAY),
    hours: Math.floor((left % DAY) / HOUR),
    minutes: Math.floor((left % HOUR) / MINUTE),
    seconds: Math.floor((left % MINUTE) / 1000),
  }
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
 *   remainingMs={3_600_000}
 *   announcement="The next session is Tuesday at 7:00 pm, in 1 hour."
 * />
 */
export function Countdown({
  remainingMs,
  announcement,
  showSeconds = true,
  size = 'lg',
  className = '',
  ...props
}: CountdownProps) {
  const t = useT()
  const figures = figuresOf(remainingMs)
  const { numbers, labels } = SIZE_CLASSES[size]

  const cells: [number, string][] = [
    ...(figures.days >= 1
      ? ([[figures.days, t('blocks.general.days')]] as [number, string][])
      : []),
    [figures.hours, t('blocks.general.hours')],
    [figures.minutes, t('blocks.general.minutes')],
    ...(showSeconds
      ? ([[figures.seconds, t('blocks.general.seconds')]] as [number, string][])
      : []),
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
        {cells.map(([value, label], index) => (
          <Fragment key={label}>
            {index > 0 && <span className="mt-0">:</span>}
            <div className="inline-flex flex-col items-center">
              <span className="tabular-nums">{String(value).padStart(2, '0')}</span>
              <span className={`${labels} uppercase tracking-wide mt-0 font-number font-light`}>
                {label}
              </span>
            </div>
          </Fragment>
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
