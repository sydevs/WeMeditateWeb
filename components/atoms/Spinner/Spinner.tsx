import { ComponentProps } from 'react'
import { AnimatedLogoSvg } from '../graphics/svgs'
import { useT } from '../../../hooks/useT'

export interface SpinnerProps extends ComponentProps<'div'> {
  /**
   * Spinner variant
   * - default: Circular spinner animation
   * - logo: Animated WeMeditate logo
   * @default 'default'
   */
  variant?: 'default' | 'logo'

  /**
   * Spinner size
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'

  /**
   * Spinner color, resolved against the surface it sits on
   * @default 'primary'
   */
  color?: 'primary' | 'secondary' | 'neutral' | 'currentColor'


  /**
   * Accessible label for the loading state
   * @default 'Loading...'
   */
  label?: string
}

/**
 * Spinner component for loading states.
 *
 * Displays an animated spinner with two variants:
 * - default: Circular spinner animation
 * - logo: Animated WeMeditate logo
 *
 * Includes accessible label for screen readers.
 *
 * @example
 * <Spinner />
 * <Spinner variant="logo" size="lg" />
 * <Spinner size="lg" color="neutral" />
 * <Spinner size="sm" label="Loading content..." />
 */
export function Spinner({
  variant = 'default',
  size = 'md',
  color = 'primary',
  label,
  className = '',
  ...props
}: SpinnerProps) {
  const t = useT()
  // Default through SahajCloud, not a literal: a spinner rendered without an
  // explicit label still announces in the visitor's language.
  const resolvedLabel = label ?? t('common.general.loading')
  // Logo variant sizes
  const logoSizeStyles = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }

  // Default variant sizes
  const defaultSizeStyles = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
    xl: 'w-12 h-12 border-4',
  }

  const colorStyles = {
    primary: 'border-primary border-t-transparent',
    secondary: 'border-secondary border-t-transparent',
    neutral: 'border-fg-muted border-t-transparent',
    currentColor: 'border-current border-t-transparent',
  }

  const logoColorStyles = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    neutral: 'text-fg-muted',
    currentColor: 'text-current',
  }

  if (variant === 'logo') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={resolvedLabel}
        className={`inline-block ${className}`}
        {...props}
      >
        <AnimatedLogoSvg className={`${logoSizeStyles[size]} ${logoColorStyles[color]}`} />
        <span className="sr-only">{resolvedLabel}</span>
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={resolvedLabel}
      className={`inline-block ${className}`}
      {...props}
    >
      <div
        className={`animate-spin rounded-full ${defaultSizeStyles[size]} ${colorStyles[color]}`}
      />
      <span className="sr-only">{resolvedLabel}</span>
    </div>
  )
}
