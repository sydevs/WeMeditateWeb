import { ComponentProps, ReactNode } from 'react'
import { LeafSvg } from '../../atoms/graphics/svgs'
import {
  type AspectRatio,
  type ImageSize,
  getImageURL,
  getVariantName,
  isCloudflareImageURL,
} from '../../../lib/cloudflare-images'

export interface SplashProps extends Omit<ComponentProps<'div'>, 'children'> {
  /**
   * URL of the background image.
   * Cloudflare Images URLs are automatically transformed to the matching variant.
   */
  backgroundImage: string
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
  /** Main title text */
  title?: string
  /** Subtitle text below the title */
  subtitle?: string
  /** Call-to-action text */
  ctaText?: string
  /** Call-to-action link destination */
  ctaHref?: string
  /**
   * Theme based on background context
   * - light: Dark text for light backgrounds (default)
   * - dark: White text for dark backgrounds
   * @default 'light'
   */
  theme?: 'light' | 'dark'
  /** Whether the CTA should pulsate */
  pulsate?: boolean
  /** Optional content to display between subtitle and CTA, for example a countdown timer or search input */
  children?: ReactNode
}

/**
 * Full-screen splash section with background image, centered content, and decorative leaves.
 * Reserves 240px (pt-60) at top for the overlaid Header.
 *
 * @example
 * <Splash
 *   backgroundImage="/images/sunset.jpg"
 *   title="Meditate for Better Mental Health"
 *   subtitle="Making a start is easier than you think."
 *   ctaText="Try it now"
 *   ctaHref="/start"
 *   theme="dark"
 *   pulsate
 * />
 */
export function Splash({
  backgroundImage,
  imageAspectRatio = 'ultrawide',
  imageSize = 'xlarge',
  title,
  subtitle,
  ctaText,
  ctaHref,
  theme = 'light',
  pulsate = false,
  children,
  className = '',
  ...props
}: SplashProps) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900'

  const resolvedBackgroundImage = isCloudflareImageURL(backgroundImage)
    ? getImageURL(backgroundImage, getVariantName(imageAspectRatio, imageSize))
    : backgroundImage

  return (
    <div
      className={`relative min-h-screen flex items-center justify-center overflow-hidden ${className}`}
      {...props}
    >
      {/* Background Image */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${resolvedBackgroundImage})` }}
      />

      {/* Content Container */}
      <div className="relative z-10 w-full px-4 pt-60 pb-12 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Title */}
          {title && (
            <h1
              className={`font-raleway text-2xl md:text-4xl font-light leading-tight mb-6 ${textColor}`}
            >
              {title}
            </h1>
          )}

          {/* Subtitle */}
          {subtitle && (
            <p
              className={`text-lg md:text-xl font-light ${children ? 'mb-8' : 'mb-12'} ${textColor}`}
            >
              {subtitle}
            </p>
          )}

          {/* Optional content, for example countdown, buttons, or search input */}
          {children && <div className="mb-20">{children}</div>}

          {/* Call-to-Action with Decorative Leaves */}
          {ctaText && ctaHref && (
            <a
              className={`inline-flex items-center justify-center gap-4 text-xl md:text-2xl font-light ${textColor} transition-transform hover:scale-105 ${
                pulsate ? 'animate-pulse-scale' : ''
              }`}
              href={ctaHref}
            >
              {/* Left Leaf (rotated outward) */}
              <LeafSvg aria-hidden="true" className="w-16 h-16 -rotate-90" />

              {/* CTA Text */}
              <span>{ctaText}</span>

              {/* Right Leaf (rotated outward) */}
              <LeafSvg aria-hidden="true" className="w-16 h-16 rotate-90" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
