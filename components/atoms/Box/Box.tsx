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
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'

  /**
   * Background color
   * @default undefined
   */
  background?: 'white' | 'subtle' | 'light' | 'warm' | 'primary' | 'secondary'

  /**
   * Border style
   * @default undefined
   */
  border?: boolean | 'light'

  /**
   * Border radius
   * @default undefined
   */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'

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
 * Provides a flexible container with padding, background, border, and shadow options.
 * Use as a building block for cards, panels, and other contained content.
 *
 * @example
 * <Box padding="md" background="white" rounded="lg" shadow="md">
 *   Card content
 * </Box>
 *
 * <Box as="article" padding="lg" border>
 *   Article content
 * </Box>
 *
 * <Box background="primary" padding="xl" rounded="xl">
 *   Colored box
 * </Box>
 */
export function Box({
  as = 'div',
  padding,
  background,
  border,
  rounded,
  shadow,
  className = '',
  children,
  ...props
}: BoxProps & Omit<ComponentProps<'div'>, keyof BoxProps>) {
  const Component = as

  const paddingStyles = padding
    ? {
        none: 'p-0',
        sm: 'p-2',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      }[padding]
    : ''

  const backgroundStyles = background
    ? {
        white: 'bg-white',
        subtle: 'bg-gray-50',
        light: 'bg-gray-100',
        warm: 'bg-bg-warm',
        primary: 'bg-teal-50',
        secondary: 'bg-coral-50',
      }[background]
    : ''

  const borderStyles = border
    ? border === 'light'
      ? 'border border-gray-300'
      : 'border border-gray-400'
    : ''

  const roundedStyles = rounded
    ? {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        full: 'rounded-full',
      }[rounded]
    : ''

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
      className={`${paddingStyles} ${backgroundStyles} ${borderStyles} ${roundedStyles} ${shadowStyles} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}
