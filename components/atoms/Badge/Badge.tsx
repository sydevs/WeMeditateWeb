import { ComponentProps } from 'react'

export interface BadgeProps extends ComponentProps<'span'> {
  /**
   * Badge color variant
   * @default 'neutral'
   */
  color?: 'primary' | 'secondary' | 'neutral'

  /**
   * Badge shape
   * @default 'square'
   */
  shape?: 'square' | 'circular'

  /**
   * Badge size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Badge content (text or number)
   */
  children: React.ReactNode
}

/**
 * Badge component for displaying labels, counts, or status indicators.
 *
 * A simple visual container for short text, numbers, or icons.
 * Used for duration labels, notification counts, status indicators, etc.
 *
 * Features:
 * - Three color variants: primary (teal), secondary (coral), neutral (gray)
 * - Two shape options: square (slightly rounded) or circular (fully rounded)
 * - Compact, readable design with proper contrast
 * - Accessible with semantic HTML
 *
 * @example
 * // Duration badge (neutral, circular)
 * <Badge color="neutral" shape="circular">10 min</Badge>
 *
 * @example
 * // Notification count (primary, circular)
 * <Badge color="primary" shape="circular">3</Badge>
 *
 * @example
 * // Status indicator (secondary, square)
 * <Badge color="secondary" shape="square">New</Badge>
 */
export function Badge({
  color = 'neutral',
  shape = 'square',
  size = 'md',
  className = '',
  children,
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium font-sans'

  const colorStyles = {
    primary: 'bg-teal-100 text-teal-800',
    secondary: 'bg-coral-100 text-coral-800',
    neutral: 'bg-gray-100 text-gray-800',
  }

  const shapeStyles = {
    square: '',
    circular: 'rounded-full',
  }

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-2.5 py-1 text-sm',
  }

  return (
    <span
      className={`${baseStyles} ${colorStyles[color]} ${shapeStyles[shape]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
