import { ComponentProps } from 'react'

export interface IconProps extends Omit<ComponentProps<'span'>, 'children'> {
  /**
   * Icon name (maps to custom icon font classes or children)
   */
  name?: string

  /**
   * Icon size
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

  /**
   * Icon color
   * @default 'currentColor'
   */
  color?: 'primary' | 'secondary' | 'tertiary' | 'currentColor'

  /**
   * Custom icon content (for SVG or other elements)
   */
  children?: React.ReactNode
}

/**
 * Icon component for displaying icons from custom icon font or SVG.
 *
 * Supports size variants and color options.
 * Can use icon name from WeMeditate icon font or render custom children.
 *
 * @example
 * <Icon name="play" size="lg" />
 * <Icon name="heart" color="primary" />
 * <Icon size="xl">
 *   <svg>...</svg>
 * </Icon>
 */
export function Icon({
  name,
  size = 'md',
  color = 'currentColor',
  className = '',
  children,
  ...props
}: IconProps) {
  const sizeStyles = {
    xs: 'text-xs w-3 h-3',
    sm: 'text-sm w-4 h-4',
    md: 'text-base w-5 h-5',
    lg: 'text-lg w-6 h-6',
    xl: 'text-xl w-8 h-8',
    '2xl': 'text-2xl w-10 h-10',
  }

  const colorStyles = {
    primary: 'text-teal-600',
    secondary: 'text-coral-500',
    tertiary: 'text-gray-600',
    currentColor: 'text-current',
  }

  const baseStyles = 'inline-flex items-center justify-center flex-shrink-0'

  // If using custom icon font, apply the name as a class
  const iconFontClass = name ? `wm-icon-${name}` : ''

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${colorStyles[color]} ${iconFontClass} ${className}`}
      aria-hidden="true"
      {...props}
    >
      {children}
    </span>
  )
}
