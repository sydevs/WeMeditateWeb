import { ComponentProps } from 'react'
import { Icon, HeroIcon } from '../Icon/Icon'
import { Spinner } from '../Spinner/Spinner'
import { Link } from '../Link'

export interface ButtonProps extends Omit<ComponentProps<'button'>, 'type'> {
  /**
   * Visual style variant
   * - outline-light: White border/text for dark backgrounds (with animated hover)
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'outline-light' | 'ghost'

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
   * Optional href to render as a link (using Link component)
   * When provided, button renders as a link instead of a button element
   */
  href?: string

  /**
   * Locale for the link (only used when href is provided)
   */
  locale?: string

  /**
   * Button type (only used when href is not provided)
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset'

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
  href,
  locale,
  className = '',
  children,
  disabled,
  type = 'button',
  'aria-label': ariaLabel,
  ...props
}: ButtonProps) {
  // Determine if this is an icon-only button
  const isIconOnly = icon && !children

  // Styles for animated hover effect (wemeditate.com center-to-edges animation)
  // Uses ::after pseudo-element that scales from center on hover
  // Only applied to text buttons, not icon-only buttons
  const animatedHoverEffect =
    'relative isolate overflow-hidden after:absolute after:inset-0 after:-z-10 after:scale-x-0 after:opacity-0 after:transition-all after:duration-300 after:ease-out hover:after:scale-x-100 hover:after:opacity-100'

  const baseStyles =
    'inline-flex items-center justify-center text-center font-sans font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'

  // Only add animation if button is interactive (not disabled or loading)
  const isInteractive = !disabled && !isLoading
  const animatedStyles = isIconOnly || !isInteractive ? '' : animatedHoverEffect

  // Variant styles - use after: pseudo-element for text buttons, direct hover for icon-only
  const variantStyles = isIconOnly ? {
    primary:
      'bg-teal-500 hover:bg-teal-600 text-white focus:ring-teal-500 active:bg-teal-700',
    secondary:
      'bg-coral-500 hover:bg-coral-600 text-white focus:ring-coral-500 active:bg-coral-700',
    outline:
      'bg-transparent border border-gray-500 text-gray-700 focus:ring-gray-500 hover:bg-teal-100 hover:border-gray-500',
    'outline-light':
      'bg-transparent border border-white text-white focus:ring-white hover:bg-white hover:text-gray-800 hover:border-white',
    ghost:
      'bg-transparent text-gray-700 focus:ring-gray-400 hover:bg-gray-100 hover:text-gray-900',
  } : {
    primary:
      'bg-teal-500 after:bg-teal-600 text-white focus:ring-teal-500 active:after:bg-teal-700',
    secondary:
      'bg-coral-500 after:bg-coral-600 text-white focus:ring-coral-500 active:after:bg-coral-700',
    outline:
      'bg-transparent border border-gray-500 text-gray-700 focus:ring-gray-500 after:bg-teal-100 hover:border-gray-500',
    'outline-light':
      'bg-transparent border border-white text-white focus:ring-white after:bg-white hover:text-gray-800 hover:border-white',
    ghost:
      'bg-transparent text-gray-700 focus:ring-gray-400 after:bg-gray-100 hover:text-gray-900',
  }

  // Size styles for icon-only buttons
  const iconOnlySizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  // Size styles for text buttons (with or without icon)
  // Inspired by wemeditate.com: generous padding, no rounding
  const textButtonSizeStyles = {
    sm: 'px-6 py-2 text-sm gap-2',
    md: 'px-8 py-3 text-base gap-2',
    lg: 'px-8 py-5 text-base gap-2',
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
    'outline-light': 'white' as const,
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

  const commonClassNames = `${baseStyles} ${animatedStyles} ${variantStyles[variant]} ${sizeClass} ${shapeClass} ${widthStyles} ${className}`

  const content = isLoading ? (
    <Spinner size={spinnerSizeMap[size]} color={spinnerColorMap[variant]} />
  ) : (
    <>
      {icon && <Icon icon={icon} size={iconSizeMap[size]} />}
      {children}
    </>
  )

  // Render as Link if href is provided
  if (href) {
    return (
      <Link
        href={href}
        locale={locale}
        variant="unstyled"
        className={commonClassNames}
        aria-label={isIconOnly ? ariaLabel : undefined}
        {...(props as any)}
      >
        {content}
      </Link>
    )
  }

  // Render as button
  return (
    <button
      type={type}
      className={commonClassNames}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-label={isIconOnly ? ariaLabel : undefined}
      {...props}
    >
      {content}
    </button>
  )
}
