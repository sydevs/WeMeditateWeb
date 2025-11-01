import { ComponentProps, ElementType, ReactNode } from 'react'

export interface BoxProps {
  /**
   * The HTML element to render
   * @default 'div'
   */
  as?: ElementType

  /**
   * Padding size
   * @default undefined
   */
  padding?: 'sm' | 'md' | 'lg'

  /**
   * Color variant (affects background, text, and border colors)
   * @default undefined
   */
  color?: 'white' | 'gray' | 'primary' | 'secondary'

  /**
   * Show border
   * @default false
   */
  border?: boolean

  /**
   * Apply rounded corners
   * @default false
   */
  rounded?: boolean

  /**
   * Shadow depth
   * @default undefined
   */
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'

  /**
   * Additional CSS classes
   */
  className?: string

  /**
   * Box content
   */
  children: ReactNode
}

/**
 * Box component for generic containers with styling utilities.
 *
 * Provides a flexible container with padding, color, border, and shadow options.
 * Use as a building block for cards, panels, and other contained content.
 *
 * @example
 * <Box padding="md" color="white" rounded border shadow="md">
 *   Card content
 * </Box>
 *
 * <Box as="article" padding="lg" color="primary" border>
 *   Article content
 * </Box>
 *
 * <Box color="secondary" padding="lg" rounded>
 *   Colored box
 * </Box>
 */
export function Box({
  as = 'div',
  padding,
  color,
  border = false,
  rounded = false,
  shadow,
  className = '',
  children,
  ...props
}: BoxProps & Omit<ComponentProps<'div'>, keyof BoxProps>) {
  const Component = as

  const paddingStyles = padding
    ? {
        sm: 'p-5',
        md: 'py-8 px-12',
        lg: 'py-12 px-18',
      }[padding]
    : ''

  const colorStyles = color
    ? {
        white: 'bg-white text-gray-900',
        gray: 'bg-gray-100 text-gray-900',
        primary: 'bg-teal-50 text-teal-900',
        secondary: 'bg-coral-50 text-coral-900',
      }[color]
    : ''

  const borderStyles = border && color
    ? {
        white: 'border border-gray-300',
        gray: 'border border-gray-400',
        primary: 'border border-teal-400',
        secondary: 'border border-coral-400',
      }[color]
    : ''

  const roundedStyles = rounded ? 'rounded-lg' : ''

  const shadowStyles = shadow
    ? {
        none: 'shadow-none',
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
        xl: 'shadow-xl',
      }[shadow]
    : ''

  return (
    <Component
      className={`${paddingStyles} ${colorStyles} ${borderStyles} ${roundedStyles} ${shadowStyles} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}
