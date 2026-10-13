import { ComponentProps } from 'react'
import { Icon, HeroIcon } from '../Icon/Icon'
import { Spinner } from '../Spinner/Spinner'
import { Link } from '../Link'
import type { Locale } from '../../../server/sahajcloud-types'

export interface ButtonProps extends Omit<ComponentProps<'button'>, 'type'> {
  /**
   * Visual style variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'neutral' | 'outline' | 'ghost'


  /**
   * Button size
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg'

  /**
   * Button shape
   * - square: No border radius (sharp corners)
   * - circular: Circle for icon-only, pill shape for text buttons
   * @default 'circular' for icon-only, 'square' for text buttons
   */
  shape?: 'square' | 'circular'

  /**
   * Optional icon (Heroicons component).
   * For icon-only buttons, do not provide children.
   * For buttons with icon and text, provide both icon and children.
   *
   * @example
   * import { PlayIcon } from '@heroicons/react/24/outline'
   * <Button icon={PlayIcon} aria-label="Play" /> // Icon only
   * <Button icon={PlayIcon}>Play Video</Button> // Icon and text
   */
  icon?: HeroIcon

  /**
   * Loading state. Disables the button and shows a spinner.
   * @default false
   */
  isLoading?: boolean

  /**
   * Active state for the current-page navigation link. When true, the
   * button renders with a persistent tinted fill, reusing the ghost hover
   * fill so it stays surface-aware, and it carries `aria-current="page"`. Use
   * it for the current page's link in a nav.
   * @default false
   */
  isActive?: boolean

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

  /** Locale for the link (only used when href is provided) */
  locale?: Locale

  /**
   * Button type (only used when href is not provided)
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset'

  /** Accessible label (required for icon-only buttons without text) */
  'aria-label'?: string
}

/**
 * Unified Button component for all button types.
 *
 * Supports:
 * - Text-only buttons
 * - Icon-only buttons (circular or square)
 * - Icon-and-text buttons
 * - Multiple variants: primary, secondary, outline, ghost
 * - Loading states with spinner
 * - Different sizes and shapes
 *
 * @example
 * // Text button
 * <Button variant="primary">Click me</Button>
 *
 * // Icon-only button (square, the default)
 * import { PlayIcon } from '@heroicons/react/24/outline'
 * <Button icon={PlayIcon} aria-label="Play" />
 *
 * // Icon-only button (circular)
 * <Button icon={PlayIcon} shape="circular" aria-label="Play" />
 *
 * // Icon and text button
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
  isActive = false,
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

  // Styles for the animated hover effect (the wemeditate.com
  // center-to-edges animation). This uses an ::after pseudo-element that
  // scales from the center on hover. It applies only to text buttons, not
  // icon-only buttons.
  //
  // When `isActive`, the same ::after fill shows permanently, scaled and
  // opaque instead of hover-triggered, so the current-page nav link keeps a
  // persistent, surface-aware tint. It reuses each variant's `after:bg-*`
  // color (ghost → `bg-tint`), so this needs no
  // separate `bg-*` override, and there is no Tailwind class-order conflict.
  const animatedBase = 'relative isolate overflow-hidden after:absolute after:inset-0 after:-z-10'
  const animatedHoverEffect = isActive
    ? `${animatedBase} after:scale-x-100 after:opacity-100`
    : `${animatedBase} after:scale-x-0 after:opacity-0 after:transition-all after:duration-300 after:ease-out hover:after:scale-x-100 hover:after:opacity-100`

  const baseStyles = `inline-flex items-center justify-center text-center font-sans font-medium transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus-ring`

  // Only add animation if button is interactive (not disabled or loading)
  const isInteractive = !disabled && !isLoading
  const animatedStyles = isIconOnly || !isInteractive ? '' : animatedHoverEffect

  // Filled variants look the same on every surface. Outline and ghost take
  // their text, border and hover tint from the surface tokens.
  const iconOnlyStyles = {
    primary: 'bg-teal-500 hover:bg-teal-600 text-white active:bg-teal-700',
    secondary: 'bg-coral-500 hover:bg-coral-600 text-white active:bg-coral-700',
    outline:
      'bg-transparent border border-line text-fg-muted hover:bg-highlight hover:text-on-highlight',
    ghost: 'bg-transparent text-fg-muted hover:bg-tint hover:text-fg',
    neutral: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200',
  }

  // Text buttons fill on hover through the animated ::after layer.
  const textButtonStyles = {
    primary: 'bg-teal-500 after:bg-teal-600 text-white active:after:bg-teal-700',
    secondary: 'bg-coral-500 after:bg-coral-600 text-white active:after:bg-coral-700',
    outline:
      'bg-transparent border border-line text-fg-muted after:bg-highlight hover:text-on-highlight',
    ghost: 'bg-transparent text-fg-muted after:bg-tint hover:text-fg',
    neutral: 'bg-white after:bg-gray-50 text-gray-700 border border-gray-200',
  }

  const variantStyles = isIconOnly ? iconOnlyStyles : textButtonStyles

  // Size styles for icon-only buttons
  const iconOnlySizeStyles = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  // Size styles for text buttons (with or without icon)
  // Inspired by wemeditate.com: generous padding, no rounding
  // `xs` and `sm` compute below 44px and are clamped there by `touch-target`,
  // so the two render the same height and differ only horizontally.
  const textButtonSizeStyles = {
    xs: 'px-3 py-1.5 text-sm gap-1.5',
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
    xs: 'xs' as const,
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'lg' as const,
  }

  // The spinner takes the button's own text colour, so it reads on every fill.
  const spinnerSizeMap = {
    xs: 'sm' as const,
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'lg' as const,
  }

  const sizeClass = isIconOnly ? iconOnlySizeStyles[size] : textButtonSizeStyles[size]

  // Default shape differs based on button type
  const defaultShape = isIconOnly ? 'circular' : 'square'
  const actualShape = shape || defaultShape

  const shapeClass = isIconOnly
    ? iconOnlyShapeStyles[actualShape]
    : textButtonShapeStyles[actualShape]

  const widthStyles = fullWidth && !isIconOnly ? 'w-full' : ''

  // An icon-only button's drawn circle is what the media-control rows lay out
  // around, so it takes the overlay rather than growing. Applied at every size
  // on purpose, `lg` included: the guarantee must not depend on the size table
  // above staying at or over 44px.
  const touchTargetStyles = isIconOnly ? 'touch-target-overlay' : 'touch-target'

  const commonClassNames = `${baseStyles} ${animatedStyles} ${touchTargetStyles} ${variantStyles[variant]} ${sizeClass} ${shapeClass} ${widthStyles} ${className}`

  const content = isLoading ? (
    <Spinner color="currentColor" size={spinnerSizeMap[size]} />
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
        aria-current={isActive ? 'page' : undefined}
        aria-label={isIconOnly ? ariaLabel : undefined}
        className={commonClassNames}
        href={href}
        locale={locale}
        variant="unstyled"
        {...(props as any)}
      >
        {content}
      </Link>
    )
  }

  // Render as button
  return (
    <button
      aria-busy={isLoading}
      aria-current={isActive ? 'page' : undefined}
      aria-label={isIconOnly ? ariaLabel : undefined}
      className={commonClassNames}
      disabled={disabled || isLoading}
      type={type}
      {...props}
    >
      {content}
    </button>
  )
}
