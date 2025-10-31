import { ComponentProps } from 'react'

export interface ButtonProps extends ComponentProps<'button'> {
  /**
   * Visual style variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'text'

  /**
   * Button size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Loading state - disables button and shows loading text
   * @default false
   */
  isLoading?: boolean

  /**
   * Full width button
   * @default false
   */
  fullWidth?: boolean
}

/**
 * Button component for user actions.
 *
 * Provides consistent button styling with multiple variants and sizes.
 * Supports loading states and full-width layouts.
 *
 * @example
 * <Button variant="primary" onClick={handleClick}>Click me</Button>
 * <Button variant="secondary" size="lg">Large button</Button>
 * <Button variant="outline" isLoading>Loading...</Button>
 * <Button variant="text" size="sm">Text link button</Button>
 */
export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-sans font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    primary:
      'bg-teal-500 hover:bg-teal-600 text-white focus:ring-teal-500 active:bg-teal-700',
    secondary:
      'bg-coral-500 hover:bg-coral-600 text-white focus:ring-coral-500 active:bg-coral-700',
    outline:
      'bg-transparent border-2 border-teal-500 text-teal-600 hover:bg-teal-50 focus:ring-teal-500 active:bg-teal-100',
    text: 'bg-transparent text-teal-600 hover:text-teal-700 hover:underline focus:ring-teal-500',
  }

  const sizeStyles = {
    sm: 'px-4 py-1.5 text-sm rounded-md',
    md: 'px-6 py-2.5 text-base rounded-lg',
    lg: 'px-8 py-3.5 text-lg rounded-lg',
  }

  const widthStyles = fullWidth ? 'w-full' : ''

  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  )
}
