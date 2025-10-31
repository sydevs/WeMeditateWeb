import { ComponentProps } from 'react'

export interface DurationProps extends ComponentProps<'span'> {
  /**
   * Duration in minutes
   */
  minutes?: number

  /**
   * Duration in seconds (will be converted to minutes if > 60)
   */
  seconds?: number

  /**
   * Display format
   * @default 'short'
   */
  format?: 'short' | 'long' | 'minimal'

  /**
   * Visual style variant
   * @default 'default'
   */
  variant?: 'default' | 'badge' | 'inline'
}

/**
 * Duration component for displaying time lengths.
 *
 * Formats and displays duration in consistent format (e.g., "10 min").
 * Can display as badge or inline text.
 *
 * @example
 * <Duration minutes={10} />
 * <Duration seconds={900} format="long" />
 * <Duration minutes={15} variant="badge" />
 * <Duration minutes={5} variant="inline" format="minimal" />
 */
export function Duration({
  minutes = 0,
  seconds = 0,
  format = 'short',
  variant = 'default',
  className = '',
  ...props
}: DurationProps) {
  // Convert seconds to minutes if provided
  const totalMinutes = minutes + Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  // Format duration text
  const formatDuration = () => {
    if (format === 'minimal') {
      return `${totalMinutes}m`
    }

    if (format === 'long') {
      const minuteText = totalMinutes === 1 ? 'minute' : 'minutes'
      if (remainingSeconds > 0) {
        const secondText = remainingSeconds === 1 ? 'second' : 'seconds'
        return `${totalMinutes} ${minuteText}, ${remainingSeconds} ${secondText}`
      }
      return `${totalMinutes} ${minuteText}`
    }

    // Default 'short' format
    return `${totalMinutes} min`
  }

  const baseStyles = 'inline-flex items-center font-sans'

  const variantStyles = {
    default: 'text-sm text-gray-700',
    badge:
      'px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full',
    inline: 'text-sm text-gray-600',
  }

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {formatDuration()}
    </span>
  )
}
