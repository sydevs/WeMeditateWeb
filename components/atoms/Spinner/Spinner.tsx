import { ComponentProps } from 'react'

export interface SpinnerProps extends ComponentProps<'div'> {
  /**
   * Spinner size
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'

  /**
   * Spinner color
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
 * Displays an animated circular spinner with customizable size and color.
 * Includes accessible label for screen readers.
 *
 * @example
 * <Spinner />
 * <Spinner size="lg" color="neutral" theme="dark" />
 * <Spinner size="sm" label="Loading content..." />
 */
export function Spinner({
  size = 'md',
  color = 'primary',
  theme = 'light',
  label = 'Loading...',
  className = '',
  ...props
}: SpinnerProps) {
  const sizeStyles = {
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

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`inline-block ${className}`}
      {...props}
    >
      <div
        className={`animate-spin rounded-full ${sizeStyles[size]} ${colorStyles[color]}`}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
