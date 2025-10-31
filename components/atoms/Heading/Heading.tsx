import { ComponentProps, ElementType } from 'react'

export interface HeadingProps extends ComponentProps<'h1'> {
  /**
   * The heading level (h1-h6)
   * @default 'h2'
   */
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

  /**
   * Visual style variant
   * @default matches the level
   */
  styleAs?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

/**
 * Heading component for consistent typography hierarchy.
 *
 * Supports semantic HTML (h1-h6) with independent visual styling.
 * Use `level` for semantic structure and `styleAs` to override visual appearance.
 *
 * @example
 * <Heading level="h1">Page Title</Heading>
 * <Heading level="h2" styleAs="h1">Visually large h2</Heading>
 * <Heading level="h3" className="text-teal-600">Custom colored heading</Heading>
 */
export function Heading({
  level = 'h2',
  styleAs,
  className = '',
  children,
  ...props
}: HeadingProps) {
  const Component = level as ElementType
  const visualLevel = styleAs || level

  const baseStyles = 'font-sans text-gray-900'

  const levelStyles = {
    h1: 'text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight',
    h2: 'text-3xl sm:text-4xl lg:text-5xl font-medium leading-tight',
    h3: 'text-2xl sm:text-3xl lg:text-4xl font-medium leading-snug',
    h4: 'text-xl sm:text-2xl lg:text-3xl font-medium leading-snug',
    h5: 'text-lg sm:text-xl lg:text-2xl font-medium leading-normal',
    h6: 'text-base sm:text-lg lg:text-xl font-medium leading-normal',
  }

  return (
    <Component
      className={`${baseStyles} ${levelStyles[visualLevel]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}
