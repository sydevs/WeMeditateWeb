import { ComponentProps, ElementType, ReactNode } from 'react'

export interface ContainerProps {
  /**
   * The HTML element to render
   * @default 'div'
   */
  as?: ElementType

  /**
   * Maximum width variant
   * @default 'default'
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'default'

  /**
   * Horizontal padding size
   * @default 'md'
   */
  padding?: 'sm' | 'md' | 'lg'

  /**
   * Center the container
   * @default true
   */
  center?: boolean

  /**
   * Additional CSS classes
   */
  className?: string

  /**
   * Container content
   */
  children: ReactNode
}

/**
 * Container component for consistent content width and spacing.
 *
 * Provides responsive container with max-width constraints and horizontal padding.
 * Centers content by default for standard page layouts.
 *
 * @example
 * <Container>Content here</Container>
 * <Container maxWidth="lg">Narrower content</Container>
 * <Container maxWidth="full" padding="lg">Full width with large padding</Container>
 * <Container as="section" padding="sm">Semantic section with small padding</Container>
 */
export function Container({
  as = 'div',
  maxWidth = 'default',
  padding = 'md',
  center = true,
  className = '',
  children,
  ...props
}: ContainerProps & Omit<ComponentProps<'div'>, keyof ContainerProps>) {
  const Component = as

  const maxWidthStyles = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
    default: 'max-w-7xl', // Default max width (1280px)
  }

  const paddingStyles = {
    sm: 'px-4 sm:px-6 lg:px-8',      // Smaller padding
    md: 'px-8 sm:px-12 lg:px-16',    // Medium padding (doubled from original)
    lg: 'px-12 sm:px-16 lg:px-24',   // Large padding
  }

  const centerStyles = center ? 'mx-auto' : ''

  return (
    <Component
      className={`${maxWidthStyles[maxWidth]} ${paddingStyles[padding]} ${centerStyles} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}
