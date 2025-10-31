import { ComponentProps } from 'react'

export interface SpacerProps extends ComponentProps<'div'> {
  /**
   * Spacing size (uses Tailwind spacing scale)
   * @default 4
   */
  size?: 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32

  /**
   * Direction of spacing
   * @default 'vertical'
   */
  direction?: 'vertical' | 'horizontal'
}

/**
 * Spacer component for consistent spacing between elements.
 *
 * Provides vertical or horizontal spacing using Tailwind's spacing scale.
 * Use for adding breathing room between sections or components.
 *
 * @example
 * <Spacer size={8} />
 * <Spacer size={12} direction="horizontal" />
 * <Spacer size={4} />
 */
export function Spacer({
  size = 4,
  direction = 'vertical',
  className = '',
  ...props
}: SpacerProps) {
  const spacingClass = direction === 'vertical' ? `h-${size}` : `w-${size}`

  return (
    <div
      className={`${spacingClass} ${className}`}
      aria-hidden="true"
      {...props}
    />
  )
}
