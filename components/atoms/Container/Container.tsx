import { ComponentProps, ElementType, ReactNode } from 'react'

export interface ContainerProps {
  /**
   * The HTML element to render
   * @default 'div'
   */
  as?: ElementType

  /**
   * Maximum width variant — a content-width scale (max-w-3xl → max-w-7xl):
   * `sm`=3xl (768px), `md`=4xl (896px, readable body), `lg`=5xl (1024px),
   * `xl`=6xl (1152px), `2xl`=7xl (1280px). `full` removes the constraint.
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
 * Provides a max-width constraint and a flat horizontal gutter (px-4 at all
 * breakpoints). Centers content by default for standard page layouts.
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
    sm: 'max-w-3xl', // 768px
    md: 'max-w-4xl', // 896px — readable article/body column
    lg: 'max-w-5xl', // 1024px
    xl: 'max-w-6xl', // 1152px
    '2xl': 'max-w-7xl', // 1280px
    full: 'max-w-full',
    default: 'max-w-7xl', // Default max width (1280px)
  }

  // Horizontal gutter — a flat px-4 at all breakpoints
  const paddingStyles = 'px-4'

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
