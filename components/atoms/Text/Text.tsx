import { ComponentProps, ElementType, ReactNode } from 'react'

export interface TextProps {
  /**
   * The HTML element to render
   * @default 'p'
   */
  as?: 'p' | 'span' | 'div'

  /**
   * Size variant
   * @default 'base'
   */
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl'

  /**
   * Font weight
   * @default 'light'
   */
  weight?: 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold'

  /**
   * Text color variant
   * @default 'primary'
   */
  color?: 'default' | 'primary' | 'secondary' | 'faded' | 'inherit'

  /**
   * Additional CSS classes
   */
  className?: string

  /**
   * Content to display
   */
  children: ReactNode
}

/**
 * Text component for body copy and inline text.
 *
 * Provides consistent typography with size, weight, and color variants.
 * Can render as paragraph, span, or div based on context needs.
 *
 * @example
 * <Text>Default paragraph text</Text>
 * <Text as="span" size="sm" weight="medium">Small bold text</Text>
 * <Text size="lg" color="secondary">Large secondary text</Text>
 */
export function Text({
  as = 'p',
  size = 'base',
  weight = 'light',
  color = 'inherit',
  className = '',
  children,
  ...props
}: TextProps & Omit<ComponentProps<'p'>, keyof TextProps>) {
  const Component = as as ElementType

  const sizeStyles = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  }

  const weightStyles = {
    extralight: 'font-extralight',
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  }

  const colorStyles = {
    default: 'text-gray-900',
    primary: 'text-teal-700',
    secondary: 'text-coral-700',
    faded: 'text-gray-700',
    inherit: '',
  }

  return (
    <Component
      className={`font-sans ${sizeStyles[size]} ${weightStyles[weight]} ${colorStyles[color]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}
