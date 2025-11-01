import { ComponentProps } from 'react'

export interface SpacerProps extends ComponentProps<'div'> {
  /**
   * Spacing size
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

  /**
   * Direction of spacing
   * @default 'vertical'
   */
  direction?: 'vertical' | 'horizontal'
}

/**
 * Spacer component for consistent spacing between elements.
 *
 * Provides vertical or horizontal spacing using named size variants.
 * Use for adding breathing room between sections or components.
 *
 * @example
 * <Spacer size="lg" />
 * <Spacer size="xl" direction="horizontal" />
 * <Spacer size="md" />
 */
export function Spacer({
  size = 'md',
  direction = 'vertical',
  className = '',
  ...props
}: SpacerProps) {
  const sizeMap = {
    xs: '2',
    sm: '4',
    md: '6',
    lg: '8',
    xl: '12',
    '2xl': '16',
    '3xl': '24',
  }

  const spacingValue = sizeMap[size]
  const spacingClass = direction === 'vertical' ? `h-${spacingValue}` : `w-${spacingValue}`

  return (
    <div
      className={`${spacingClass} ${className}`}
      aria-hidden="true"
      {...props}
    />
  )
}
