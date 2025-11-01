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
  color?: 'primary' | 'secondary' | 'tertiary' | 'currentColor'

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

  const colorStyles = {
    primary: 'text-teal-600',
    secondary: 'text-coral-500',
    tertiary: 'text-gray-600',
    currentColor: 'text-current',
  }

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
