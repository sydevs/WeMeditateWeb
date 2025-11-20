import { ComponentProps, ReactNode } from 'react'

export interface PlaceholderProps extends Omit<ComponentProps<'div'>, 'children'> {
  /**
   * Width of the placeholder in pixels
   * If not provided, fills available width (100%)
   */
  width?: number

  /**
   * Height of the placeholder in pixels
   * If not provided, fills available height (100%)
   */
  height?: number

  /**
   * Color variant for the gradient background
   * - primary: Teal gradient (brand primary)
   * - secondary: Coral gradient (brand secondary)
   * - neutral: Gray gradient (neutral tones)
   * @default 'neutral'
   */
  variant?: 'primary' | 'secondary' | 'neutral'

  /**
   * Whether to show the shimmer animation
   * @default true
   */
  animate?: boolean

  /**
   * Optional children to display centered within the placeholder
   * Useful for error icons or loading indicators
   */
  children?: ReactNode
}

/**
 * Placeholder component with blurred gradient background and optional shimmer animation.
 *
 * Used as a loading placeholder for images and content areas to prevent layout shift.
 * Features a diagonal shimmer animation that sweeps across the gradient.
 *
 * @example
 * // With explicit dimensions
 * <Placeholder width={400} height={300} variant="primary" />
 *
 * // Full width/height (fills container)
 * <Placeholder variant="neutral" />
 *
 * // With error icon (no animation)
 * <Placeholder variant="neutral" animate={false}>
 *   <Icon icon={ExclamationCircleIcon} size="lg" />
 * </Placeholder>
 */
export function Placeholder({
  width,
  height,
  variant = 'neutral',
  animate = true,
  children,
  className = '',
  style,
  ...props
}: PlaceholderProps) {
  const variantStyles = {
    primary: 'bg-gradient-to-br from-teal-100 to-teal-200',
    secondary: 'bg-gradient-to-br from-coral-100 to-coral-200',
    neutral: 'bg-gradient-to-br from-gray-100 to-gray-200',
  }

  // Text color for children based on variant
  const textColorStyles = {
    primary: 'text-teal-600',
    secondary: 'text-coral-600',
    neutral: 'text-gray-600',
  }

  // Build inline styles for dimensions
  const dimensionStyles: React.CSSProperties = {
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : '100%',
    ...style,
  }

  return (
    <div
      className={`relative overflow-hidden ${variantStyles[variant]} ${className}`}
      style={dimensionStyles}
      {...props}
    >
      {/* Shimmer overlay (only when animating) */}
      {animate && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
      )}

      {/* Centered children content */}
      {children && (
        <div className={`absolute inset-0 flex items-center justify-center ${textColorStyles[variant]}`}>
          {children}
        </div>
      )}
    </div>
  )
}
