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
 * Padding is automatically responsive: small on mobile, medium on tablet, large on desktop.
 * Centers content by default for standard page layouts.
 *
 * @example
 * <Container>Content here</Container>
 * <Container maxWidth="lg">Narrower content</Container>
 * <Container maxWidth="full">Full width container</Container>
 * <Container as="section">Semantic section container</Container>
 */
export function Container({
  as = 'div',
  maxWidth = 'default',
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

  // Responsive padding: small (mobile), medium (tablet), large (desktop)
  const paddingStyles = 'px-4 sm:px-8 lg:px-16'

  const centerStyles = center ? 'mx-auto' : ''

  return (
    <Component
      className={`${maxWidthStyles[maxWidth]} ${paddingStyles} ${centerStyles} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}
