import { ComponentProps } from 'react'

export interface IconButtonProps extends ComponentProps<'button'> {
  /**
   * Visual style variant
   * @default 'default'
   */
  variant?: 'default' | 'primary' | 'secondary' | 'ghost'

  /**
   * Button size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Shape of the button
   * @default 'circle'
   */
  shape?: 'circle' | 'square'

  /**
   * Accessible label for the button action
   */
  'aria-label': string
}

/**
 * IconButton component for icon-only actions.
 *
 * Circular or square buttons designed to contain a single icon.
 * Always requires an aria-label for accessibility.
 *
 * @example
 * <IconButton aria-label="Close dialog">
 *   <CloseIcon />
 * </IconButton>
 *
 * <IconButton variant="primary" size="lg" aria-label="Play meditation">
 *   <PlayIcon />
 * </IconButton>
 *
 * <IconButton shape="square" aria-label="More options">
 *   <MenuIcon />
 * </IconButton>
 */
export function IconButton({
  variant = 'default',
  size = 'md',
  shape = 'circle',
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}: IconButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    default:
      'bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-400 active:bg-gray-300',
    primary:
      'bg-teal-500 hover:bg-teal-600 text-white focus:ring-teal-500 active:bg-teal-700',
    secondary:
      'bg-coral-500 hover:bg-coral-600 text-white focus:ring-coral-500 active:bg-coral-700',
    ghost:
      'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-400 active:bg-gray-200',
  }

  const sizeStyles = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  }

  const shapeStyles = {
    circle: 'rounded-full',
    square: 'rounded-lg',
  }

  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${shapeStyles[shape]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
