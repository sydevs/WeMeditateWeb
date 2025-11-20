import { ComponentProps } from 'react'
import { Button, Image } from '../../atoms'

export interface ContentOverlayProps extends Omit<ComponentProps<'div'>, 'children'> {
  /**
   * Main heading text
   */
  title: string

  /**
   * Body text content (can be string or array of paragraphs)
   */
  text: string | string[]

  /**
   * Background image URL
   */
  imageSrc: string

  /**
   * Alt text for background image
   */
  imageAlt?: string

  /**
   * Call-to-action button text
   */
  ctaText?: string

  /**
   * Call-to-action button link
   */
  ctaHref?: string

  /**
   * Color theme variant
   * - `light`: Near-black text and border (for light backgrounds)
   * - `dark`: White text and border (for dark backgrounds)
   */
  theme?: 'light' | 'dark'

  /**
   * Content alignment
   * - `left`: Content on left side
   * - `right`: Content on right side
   * - `center`: Content centered
   */
  align?: 'left' | 'right' | 'center'

  /**
   * Contrast variant
   * - `default`: Standard styling
   * - `highContrast`: Enhanced readability with text shadows and blend modes
   * - `box`: Content in bordered box with backdrop blur
   */
  variant?: 'default' | 'highContrast' | 'box'
}

/**
 * ContentOverlay displays a heading, text content, and optional CTA button
 * overlaid on a background image. Commonly used for feature highlights
 * and promotional sections.
 */
export function ContentOverlay({
  title,
  text,
  imageSrc,
  imageAlt = '',
  ctaText,
  ctaHref,
  theme = 'light',
  align = 'left',
  variant = 'default',
  className = '',
  ...props
}: ContentOverlayProps) {
  // Theme-based text colors - light theme only on desktop (md+), white on mobile
  const textColorClass = theme === 'dark' ? 'text-white' : 'text-[#444]'

  // Text glow/halo shadows - applied to all variants for better readability
  const textShadowClass = theme === 'dark'
    ? 'text-glow-dark'
    : 'text-glow-light'

  // Blend mode for high contrast images
  const imageBlendClass = variant === 'highContrast'
    ? theme === 'dark'
      ? 'brightness-70 contrast-70'
      : 'brightness-130 contrast-70'
    : ''

  // Box variant styling - border matches text color, subtle blur
  const boxClasses = variant === 'box'
    ? theme === 'dark'
      ? 'bg-black/40 bg-blend-multiply p-12'
      : 'bg-white/40 bg-blend-multiply p-12'
    : ''

  // Button variant based on contrast level
  const buttonVariant = variant === 'highContrast'
    ? theme === 'dark' ? 'secondary' : 'primary'
    : 'outline'

  // Button styling for non-highContrast variants to match content text
  const buttonClassName = variant === 'highContrast'
    ? ''
    : theme === 'dark'
      ? 'border-white text-white [&:not(:hover)]:text-glow-dark'
      : 'border-gray-900 text-gray-900 [&:not(:hover)]:text-glow-light'

  // Convert text to array for consistent handling
  const textParagraphs = Array.isArray(text) ? text : [text]

  // Alignment classes for the content wrapper (desktop only)
  const alignmentClasses = {
    left: 'md:mr-auto md:text-left',
    right: 'md:ml-auto md:text-right',
    center: 'md:mx-auto md:text-center',
  }

  // Max width classes - 50% on lg+ for non-box variants
  const maxWidthClasses = variant === 'box'
    ? 'max-w-md lg:max-w-lg'
    : 'max-w-md lg:max-w-[50%]'

  return (
    <div
      className={`w-full ${className}`}
      {...props}
    >
      {/* Mobile: Stacked layout - no variant or theme styling */}
      <div className="flex flex-col gap-6 md:hidden">
        {/* Image on top */}
        <div className="w-full aspect-video">
          <img
            src={imageSrc}
            alt={imageAlt}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content below */}
        <h2 className="text-2xl font-semibold tracking-wide text-gray-900">
          {title}
        </h2>

        <div className="text-lg font-light leading-relaxed text-gray-900">
          {textParagraphs.map((paragraph, index) => (
            <p key={index} className={index < textParagraphs.length - 1 ? 'mb-4' : ''}>
              {paragraph}
            </p>
          ))}
        </div>

        {ctaText && ctaHref && (
          <div className="mt-6">
            <Button
              href={ctaHref}
              variant="outline"
              size="md"
            >
              {ctaText}
            </Button>
          </div>
        )}
      </div>

      {/* Tablet / Desktop: Overlay layout with 16:9 aspect ratio */}
      <div className="hidden md:block relative w-full aspect-video overflow-hidden">
        {/* Background Image - 16:9 aspect ratio */}
        <div className="absolute inset-0">
          <Image
            src={imageSrc}
            alt={imageAlt}
            aspectRatio='video'
            className={`w-full h-full object-cover ${imageBlendClass}`}
          />
        </div>

        {/* Content Overlay */}
        <div className="relative h-full flex items-center md:px-8 lg:px-24">
          {/* Content Box - 50% max-width on lg+ for non-box variants */}
          <div className={`${maxWidthClasses} ${alignmentClasses[align]} ${boxClasses}`}>
            <h2 className={`text-xl md:text-2xl font-semibold tracking-wide mb-7 ${textColorClass} ${textShadowClass}`}>
              {title}
            </h2>

            <div className={`text-base md:text-lg font-medium leading-relaxed ${textColorClass} ${textShadowClass}`}>
              {textParagraphs.map((paragraph, index) => (
                <p key={index} className={index < textParagraphs.length - 1 ? 'mb-4' : ''}>
                  {paragraph}
                </p>
              ))}
            </div>

            {ctaText && ctaHref && (
              <div className="mt-6">
                <Button
                  href={ctaHref}
                  variant={buttonVariant}
                  theme={theme}
                  size="md"
                  className={buttonClassName}
                >
                  {ctaText}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
