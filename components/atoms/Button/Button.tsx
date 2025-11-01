import { ComponentProps } from 'react'
import { Icon, HeroIcon } from '../Icon/Icon'
import { Spinner } from '../Spinner/Spinner'

export interface ButtonProps extends ComponentProps<'button'> {
  /**
   * Visual style variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'

  /**
   * Button size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Button shape
   * - square: No border radius (sharp corners)
   * - circular: Circle for icon-only, pill shape for text buttons
   * @default 'circular' for icon-only, 'square' for text buttons
   */
  shape?: 'square' | 'circular'

  /**
   * Optional icon (Heroicons component)
   * For icon-only buttons, don't provide children
   * For buttons with icon + text, provide both icon and children
   *
   * @example
   * import { PlayIcon } from '@heroicons/react/24/outline'
   * <Button icon={PlayIcon} aria-label="Play" /> // Icon only
   * <Button icon={PlayIcon}>Play Video</Button> // Icon + text
   */
  icon?: HeroIcon

  /**
   * Loading state - disables button and shows spinner
   * @default false
   */
  isLoading?: boolean

  /**
   * Full width button (only applies to text buttons, not icon-only)
   * @default false
   */
  fullWidth?: boolean

  /**
   * Accessible label (required for icon-only buttons without text)
   */
  'aria-label'?: string
}

/**
 * Unified Button component for all button types.
 *
 * Supports:
 * - Text-only buttons
 * - Icon-only buttons (circular or square)
 * - Icon + text buttons
 * - Multiple variants: primary, secondary, outline, ghost
 * - Loading states with spinner
 * - Different sizes and shapes
 *
 * @example
 * // Text button
 * <Button variant="primary">Click me</Button>
 *
 * // Icon-only button (square - default)
 * import { PlayIcon } from '@heroicons/react/24/outline'
 * <Button icon={PlayIcon} aria-label="Play" />
 *
 * // Icon-only button (circular)
 * <Button icon={PlayIcon} shape="circular" aria-label="Play" />
 *
 * // Icon + text button
 * <Button icon={PlayIcon}>Play Video</Button>
 *
 * // Loading state
 * <Button isLoading>Save</Button>
 */
export function Button({
  variant = 'primary',
  size = 'md',
  shape,
  icon,
  isLoading = false,
  fullWidth = false,
  className = '',
  children,
  disabled,
  type = 'button',
  'aria-label': ariaLabel,
  ...props
}: ButtonProps) {
  // Determine if this is an icon-only button
  const isIconOnly = icon && !children

  const baseStyles =
    'inline-flex items-center justify-center font-sans font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    primary:
      'bg-teal-500 hover:bg-teal-600 text-white focus:ring-teal-500 active:bg-teal-700',
    secondary:
      'bg-coral-500 hover:bg-coral-600 text-white focus:ring-coral-500 active:bg-coral-700',
    outline:
      'bg-transparent border-2 border-teal-500 text-teal-600 hover:bg-teal-50 focus:ring-teal-500 active:bg-teal-100',
    ghost:
      'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-400 active:bg-gray-200',
  }

  // Size styles for icon-only buttons
  const iconOnlySizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  // Size styles for text buttons (with or without icon)
  // Includes minimum width to ensure proper button proportions
  const textButtonSizeStyles = {
    sm: 'px-4 py-1.5 text-sm gap-1.5 min-w-20',
    md: 'px-6 py-2.5 text-base gap-2 min-w-24',
    lg: 'px-8 py-3.5 text-lg gap-2.5 min-w-28',
  }

  // Shape styles for icon-only buttons
  const iconOnlyShapeStyles = {
    square: '',
    circular: 'rounded-full',
  }

  // Shape styles for text buttons
  const textButtonShapeStyles = {
    square: '',
    circular: 'rounded-full',
  }

  // Icon sizes for different button sizes
  const iconSizeMap = {
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'lg' as const,
  }

  // Spinner sizes and colors for different variants
  const spinnerSizeMap = {
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'lg' as const,
  }

  const spinnerColorMap = {
    primary: 'white' as const,
    secondary: 'white' as const,
    outline: 'primary' as const,
    ghost: 'currentColor' as const,
  }

  const sizeClass = isIconOnly
    ? iconOnlySizeStyles[size]
    : textButtonSizeStyles[size]

  // Default shape differs based on button type
  const defaultShape = isIconOnly ? 'circular' : 'square'
  const actualShape = shape || defaultShape

  const shapeClass = isIconOnly
    ? iconOnlyShapeStyles[actualShape]
    : textButtonShapeStyles[actualShape]

  const widthStyles = fullWidth && !isIconOnly ? 'w-full' : ''

  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeClass} ${shapeClass} ${widthStyles} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-label={isIconOnly ? ariaLabel : undefined}
      {...props}
    >
      {isLoading ? (
        <Spinner size={spinnerSizeMap[size]} color={spinnerColorMap[variant]} />
      ) : (
        <>
          {icon && <Icon icon={icon} size={iconSizeMap[size]} />}
          {children}
        </>
      )}
    </button>
  )
}
