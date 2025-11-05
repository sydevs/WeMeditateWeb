import { ComponentProps, useEffect, useState } from 'react'
import { AnimatedLogoSvg } from '../svgs/AnimatedLogoSvg'

export interface SplashLoaderProps extends Omit<ComponentProps<'div'>, 'color'> {
  /**
   * Background color variant that blends with the background image using multiply blend mode.
   * - `primary`: Dark teal
   * - `secondary`: Dark coral
   * - `neutral`: Dark gray
   * - `none`: No color overlay
   */
  color?: 'primary' | 'secondary' | 'neutral' | 'none'

  /**
   * Size variant for the logo and text.
   * - `sm`: Small - 16/20/24 units (mobile/tablet/desktop)
   * - `md`: Medium (default) - 20/24/28 units
   * - `lg`: Large - 24/32/40 units
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Background image URL. If provided, will be blended with the color using multiply blend mode.
   */
  backgroundImage?: string

  /**
   * When true, triggers the fade-out animation and removes the component.
   */
  isLoading?: boolean

  /**
   * Optional text to display below the animated logo.
   */
  text?: string
}

/**
 * SplashLoader overlays the entire containing element with a blended background
 * and centered animated logo with optional text. Fades out when loading completes.
 *
 * The component uses absolute positioning to fill its container, so ensure the
 * parent element has `position: relative` or another positioning context.
 *
 * @example
 * <div className="relative h-screen">
 *   <SplashLoader
 *     size="lg"
 *     color="primary"
 *     backgroundImage="/splash-bg.jpg"
 *     text="Loading your meditation..."
 *     isLoading={true}
 *   />
 * </div>
 */
export function SplashLoader({
  color = 'primary',
  size = 'md',
  backgroundImage,
  isLoading = true,
  text,
  className = '',
  ...props
}: SplashLoaderProps) {
  const [shouldRender, setShouldRender] = useState(true)

  useEffect(() => {
    if (!isLoading) {
      // Wait for fade-out animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 500) // Match the transition duration

      return () => clearTimeout(timer)
    } else {
      setShouldRender(true)
    }
  }, [isLoading])

  if (!shouldRender) {
    return null
  }

  const colorClasses = {
    primary: 'bg-teal-900',
    secondary: 'bg-coral-900',
    neutral: 'bg-gray-900',
    none: '',
  }

  const sizeClasses = {
    sm: {
      logo: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24',
      text: 'text-sm sm:text-base md:text-lg',
      gap: 'gap-3 sm:gap-4',
    },
    md: {
      logo: 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28',
      text: 'text-base sm:text-lg md:text-xl',
      gap: 'gap-4 sm:gap-5',
    },
    lg: {
      logo: 'w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40',
      text: 'text-lg sm:text-xl md:text-2xl',
      gap: 'gap-4 sm:gap-6',
    },
  }

  const backgroundImageStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})` }
    : {}

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center bg-cover bg-center bg-no-repeat transition-opacity duration-500 ${
        isLoading ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={backgroundImageStyle}
      {...props}
    >
      {/* Color overlay with multiply blend mode */}
      <div
        className={`absolute inset-0 mix-blend-multiply ${colorClasses[color]}`}
      />

      {/* Centered animated logo and text */}
      <div className={`relative z-10 flex flex-col items-center ${sizeClasses[size].gap}`}>
        <AnimatedLogoSvg className={`text-white ${sizeClasses[size].logo}`} />
        {text && (
          <p className={`text-white font-light text-center px-4 ${sizeClasses[size].text}`}>
            {text}
          </p>
        )}
      </div>
    </div>
  )
}
