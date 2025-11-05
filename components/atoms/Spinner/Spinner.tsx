import { ComponentProps } from 'react'
import { AnimatedLogoSvg } from '../svgs'

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
   * Spinner color (only applies to default variant)
   * @default 'primary'
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
 * <Spinner size="lg" color="neutral" theme="dark" />
 * <Spinner size="sm" label="Loading content..." />
 */
export function Spinner({
  variant = 'default',
  size = 'md',
  color = 'primary',
  theme = 'light',
  label = 'Loading...',
  className = '',
  ...props
}: SpinnerProps) {
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

  // Light theme colors (standard colors for light backgrounds)
  const lightThemeColors = {
    primary: 'border-teal-600 border-t-transparent',
    secondary: 'border-coral-500 border-t-transparent',
    neutral: 'border-gray-600 border-t-transparent',
    currentColor: 'border-current border-t-transparent',
  }

  // Dark theme colors (lightened colors for dark backgrounds)
  const darkThemeColors = {
    primary: 'border-teal-300 border-t-transparent',
    secondary: 'border-coral-300 border-t-transparent',
    neutral: 'border-white border-t-transparent',
    currentColor: 'border-current border-t-transparent',
  }

  const colorStyles = theme === 'dark' ? darkThemeColors : lightThemeColors

  // Logo variant uses text color based on theme
  const logoColorClass = theme === 'dark' ? 'text-white' : 'text-teal-600'

  if (variant === 'logo') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={label}
        className={`inline-block ${className}`}
        {...props}
      >
        <AnimatedLogoSvg className={`${logoSizeStyles[size]} ${logoColorClass}`} />
        <span className="sr-only">{label}</span>
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`inline-block ${className}`}
      {...props}
    >
      <div
        className={`animate-spin rounded-full ${defaultSizeStyles[size]} ${colorStyles[color]}`}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
