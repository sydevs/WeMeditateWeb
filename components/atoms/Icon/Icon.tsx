import { ComponentProps, ForwardRefExoticComponent, SVGProps, RefAttributes } from 'react'

// Heroicons icon type
export type HeroIcon = ForwardRefExoticComponent<
  Omit<SVGProps<SVGSVGElement>, 'ref'> & {
    title?: string
    titleId?: string
  } & RefAttributes<SVGSVGElement>
>

export interface IconProps extends Omit<ComponentProps<'span'>, 'children'> {
  /**
   * Heroicons icon component (import from @heroicons/react)
   *
   * @example
   * import { HeartIcon } from '@heroicons/react/24/outline'
   * <Icon icon={HeartIcon} />
   */
  icon: HeroIcon

  /**
   * Icon size
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

  /**
   * Icon color
   * @default 'currentColor'
   */
  color?: 'primary' | 'secondary' | 'neutral' | 'currentColor'

  /**
   * Theme based on background context
   * - light: Standard colors for light backgrounds (default)
   * - dark: Lightened colors for dark backgrounds
   * @default 'light'
   */
  theme?: 'light' | 'dark'

  /**
   * Accessible label for the icon (important for screen readers when icon has semantic meaning)
   */
  'aria-label'?: string
}

/**
 * Icon component for displaying Heroicons.
 *
 * Supports size variants and color options.
 * Uses Heroicons (https://heroicons.com/) - a set of beautiful hand-crafted SVG icons.
 *
 * @example
 * import { HeartIcon } from '@heroicons/react/24/outline'
 * import { StarIcon } from '@heroicons/react/24/solid'
 *
 * <Icon icon={HeartIcon} size="lg" />
 * <Icon icon={StarIcon} color="primary" />
 * <Icon icon={HeartIcon} aria-label="Favorite" />
 */
export function Icon({
  icon: IconComponent,
  size = 'md',
  color = 'currentColor',
  theme = 'light',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: IconProps) {
  const sizeStyles = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10',
  }

  // Light theme colors (standard colors for light backgrounds)
  const lightThemeColors = {
    primary: 'text-teal-600',
    secondary: 'text-coral-500',
    neutral: 'text-gray-600',
    currentColor: 'text-current',
  }

  // Dark theme colors (lightened colors for dark backgrounds)
  const darkThemeColors = {
    primary: 'text-teal-300',
    secondary: 'text-coral-300',
    neutral: 'text-white',
    currentColor: 'text-current',
  }

  const colorStyles = theme === 'dark' ? darkThemeColors : lightThemeColors

  const baseStyles = 'inline-flex items-center justify-center flex-shrink-0'

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${colorStyles[color]} ${className}`}
      aria-hidden={ariaLabel ? undefined : 'true'}
      aria-label={ariaLabel}
      {...props}
    >
      <IconComponent className="w-full h-full" />
    </span>
  )
}
