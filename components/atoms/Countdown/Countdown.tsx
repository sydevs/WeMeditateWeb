import { ComponentProps, useState, useEffect } from 'react'

export interface CountdownProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Target date/time to count down to (ISO string or Date) */
  targetDate: string | Date
  /** Optional callback when countdown reaches zero */
  onComplete?: () => void
  /**
   * Theme based on background context
   * - light: Dark text for light backgrounds (default)
   * - dark: White text for dark backgrounds
   * @default 'light'
   */
  theme?: 'light' | 'dark'
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

interface TimeRemaining {
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

/**
 * Calculate time remaining until target date
 */
function useCountdown(targetDate: string | Date, onComplete?: () => void): TimeRemaining {
  const calculateTimeRemaining = (): TimeRemaining => {
    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
    const now = new Date()
    const difference = target.getTime() - now.getTime()

    if (difference <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, isExpired: true }
    }

    const hours = Math.floor(difference / (1000 * 60 * 60))
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((difference % (1000 * 60)) / 1000)

    return { hours, minutes, seconds, isExpired: false }
  }

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(calculateTimeRemaining())
  const [hasCompleted, setHasCompleted] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const newTime = calculateTimeRemaining()
      setTimeRemaining(newTime)

      // Trigger onComplete callback only once when countdown expires
      if (newTime.isExpired && !hasCompleted && onComplete) {
        setHasCompleted(true)
        onComplete()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate, onComplete, hasCompleted])

  return timeRemaining
}

/**
 * Countdown timer atom displaying hours, minutes, and seconds.
 * Uses Futura Book font for a clean, modern appearance.
 *
 * @example
 * <Countdown
 *   targetDate={new Date(Date.now() + 3600000)}
 *   onComplete={() => console.log('Countdown finished!')}
 *   theme="dark"
 * />
 */
export function Countdown({
  targetDate,
  onComplete,
  theme = 'light',
  size = 'lg',
  className = '',
  ...props
}: CountdownProps) {
  const timeRemaining = useCountdown(targetDate, onComplete)
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900'

  // Size variants
  const sizeClasses = {
    sm: {
      numbers: 'text-4xl md:text-5xl',
      labels: 'text-sm'
    },
    md: {
      numbers: 'text-5xl md:text-6xl',
      labels: 'text-base'
    },
    lg: {
      numbers: 'text-6xl md:text-8xl',
      labels: 'text-lg'
    }
  }

  const { numbers, labels } = sizeClasses[size]

  return (
    <div className={`text-center ${textColor} ${className}`} {...props}>
      <div className={`flex items-start justify-center gap-1 font-number ${numbers} font-light tracking-wide leading-none`}>
        {/* Hours */}
        <div className="inline-flex flex-col items-center">
          <span className="tabular-nums">
            {String(timeRemaining.hours).padStart(2, '0')}
          </span>
          <span className={`${labels} uppercase tracking-wide mt-0 font-number font-light`}>
            Hours
          </span>
        </div>

        {/* Separator */}
        <span className="mt-0">:</span>

        {/* Minutes */}
        <div className="inline-flex flex-col items-center">
          <span className="tabular-nums">
            {String(timeRemaining.minutes).padStart(2, '0')}
          </span>
          <span className={`${labels} uppercase tracking-wide mt-0 font-number font-light`}>
            Minutes
          </span>
        </div>

        {/* Separator */}
        <span className="mt-0">:</span>

        {/* Seconds */}
        <div className="inline-flex flex-col items-center">
          <span className="tabular-nums">
            {String(timeRemaining.seconds).padStart(2, '0')}
          </span>
          <span className={`${labels} uppercase tracking-wide mt-0 font-number font-light`}>
            Seconds
          </span>
        </div>
      </div>
    </div>
  )
}
