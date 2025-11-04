import { ComponentProps, ReactNode } from 'react'
import { LeafSvg } from '../../atoms/svgs'

export interface SplashProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** URL of the background image */
  backgroundImage: string
  /** Main heading text */
  heading: string
  /** Subtitle text below the heading */
  subtitle: string
  /** Call-to-action text */
  ctaText: string
  /** Call-to-action link destination */
  ctaHref: string
  /** Locale for navigation (optional) */
  locale?: string
  /**
   * Theme based on background context
   * - light: Dark text for light backgrounds (default)
   * - dark: White text for dark backgrounds
   * @default 'light'
   */
  theme?: 'light' | 'dark'
  /** Whether the CTA should pulsate */
  pulsate?: boolean
  /** Optional content to display between subtitle and CTA (e.g., countdown timer) */
  children?: ReactNode
}

/**
 * Full-screen splash section with background image, centered content, and decorative leaves.
 * Reserves 234px at top for Header overlay.
 *
 * @example
 * <Splash
 *   backgroundImage="/images/sunset.jpg"
 *   heading="Meditate for Better Mental Health"
 *   subtitle="Making a start is easier than you think."
 *   ctaText="Try it now"
 *   ctaHref="/start"
 *   theme="dark"
 *   pulsate
 * />
 */
export function Splash({
  backgroundImage,
  heading,
  subtitle,
  ctaText,
  ctaHref,
  locale,
  theme = 'light',
  pulsate = false,
  children,
  className = '',
  ...props
}: SplashProps) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900'

  return (
    <div
      className={`relative min-h-screen flex items-center justify-center overflow-hidden ${className}`}
      {...props}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
        aria-hidden="true"
      />

      {/* Content Container */}
      <div className="relative z-10 w-full px-4 pt-60 pb-12 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Heading */}
          <h1
            className={`font-raleway text-2xl md:text-4xl font-light leading-tight mb-6 ${textColor}`}
          >
            {heading}
          </h1>

          {/* Subtitle */}
          <p className={`text-lg md:text-xl font-light ${children ? 'mb-8' : 'mb-12'} ${textColor}`}>
            {subtitle}
          </p>

          {/* Optional content (e.g., countdown, buttons) */}
          {children && <div className="mb-20">{children}</div>}

          {/* Call-to-Action with Decorative Leaves */}
          <a
            href={locale && locale !== 'en' ? `/${locale}${ctaHref}` : ctaHref}
            className={`inline-flex items-center justify-center gap-4 text-xl md:text-2xl font-light ${textColor} transition-transform hover:scale-105 ${
              pulsate ? 'animate-pulse-scale' : ''
            }`}
          >
            {/* Left Leaf (rotated outward) */}
            <LeafSvg
              className="w-16 h-16 -rotate-90"
              aria-hidden="true"
            />

            {/* CTA Text */}
            <span>{ctaText}</span>

            {/* Right Leaf (rotated outward) */}
            <LeafSvg
              className="w-16 h-16 rotate-90"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>
    </div>
  )
}
