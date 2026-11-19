import { ComponentProps, useEffect, useState } from 'react'
import { AnimatedLogoSvg } from '../graphics/svgs/AnimatedLogoSvg'
import { surface } from '../surface'
import {
  type AspectRatio,
  type ImageSize,
  getImageURL,
  getVariantName,
} from '../../../lib/cloudflare-images'

export interface SplashLoaderProps extends Omit<ComponentProps<'div'>, 'color'> {
  /**
   * Background color variant that blends with the background image using multiply blend mode.
   * - `primary`: Dark teal
   * - `secondary`: Dark coral
   * - `neutral`: Dark gray
   * - `warm`: The light warm background, for a loader over a light image
   * - `none`: No color overlay
   */
  color?: 'primary' | 'secondary' | 'neutral' | 'warm' | 'none'

  /**
   * Size variant for the logo and text.
   * - `sm`: Small - 16/20/24 units (mobile/tablet/desktop)
   * - `md`: Medium (default) - 20/24/28 units
   * - `lg`: Large - 24/32/40 units
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Background image URL. If provided, will be blended with the color using multiply blend mode.
   * Cloudflare Images URLs are automatically transformed to the matching variant.
   */
  backgroundImage?: string

  /**
   * Aspect ratio used to pick a Cloudflare Images variant for `backgroundImage`.
   * Ignored for non-Cloudflare URLs.
   * @default 'ultrawide'
   */
  imageAspectRatio?: AspectRatio

  /**
   * Size tier used to pick a Cloudflare Images variant for `backgroundImage`.
   * Ignored for non-Cloudflare URLs.
   * @default 'xlarge'
   */
  imageSize?: ImageSize

  /** When false, triggers the fade-out animation and removes the component. */
  isLoading?: boolean

  /**
   * Fades the overlay out on its own a few seconds after it paints, in CSS.
   * For a loader the server renders: a visitor whose JavaScript never runs
   * cannot set `isLoading`, and would otherwise stay under it.
   * `isLoading={false}` still ends it sooner.
   * @default false
   */
  autoExit?: boolean

  /** Optional text to display below the animated logo. */
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
  imageAspectRatio = 'ultrawide',
  imageSize = 'xlarge',
  isLoading = true,
  autoExit = false,
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
      // eslint-disable-next-line @eslint-react/set-state-in-effect -- a no-op on mount, since `shouldRender` starts true; it only re-arms the fade when `isLoading` flips back
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
    warm: 'bg-bg-warm',
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

  const resolvedBackgroundImage = backgroundImage
    ? getImageURL(backgroundImage, getVariantName(imageAspectRatio, imageSize))
    : undefined

  const surfaceClass = surface(color === 'warm' ? 'light' : 'dark')
  const exitClass = autoExit ? 'animate-splash-loader-exit' : ''

  return (
    <div
      className={`absolute inset-0 isolate flex items-center justify-center transition-opacity duration-500 ${surfaceClass} ${
        isLoading ? 'opacity-100' : 'opacity-0'
      } ${exitClass} ${className}`}
      {...props}
    >
      {/* An <img>, not a CSS background: laid over a hero, this repeats the
          hero's URL, and the hero rule (DESIGN_SYSTEM.md, Performance) keeps
          every painting of it an <img> that shares the hero's one preload. */}
      {resolvedBackgroundImage && (
        <img
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          src={resolvedBackgroundImage}
        />
      )}

      {/* Color overlay with multiply blend mode */}
      <div
        className={`absolute inset-0 mix-blend-multiply ${colorClasses[color]}`}
      />

      {/* Centered animated logo and text */}
      <div className={`relative z-10 flex flex-col items-center ${sizeClasses[size].gap}`}>
        <AnimatedLogoSvg className={`text-fg ${sizeClasses[size].logo}`} />
        {text && (
          <p className={`text-fg font-light text-center px-4 ${sizeClasses[size].text}`}>{text}</p>
        )}
      </div>
    </div>
  )
}
