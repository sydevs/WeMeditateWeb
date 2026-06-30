import { ComponentProps } from 'react'
import { Button, Image } from '../../atoms'
import type { AspectRatio } from '../../../lib/cloudflare-images'

export interface ContentTextBoxProps extends Omit<ComponentProps<'div'>, 'title'> {
  /**
   * Main heading/title
   */
  title: string

  /**
   * Secondary line rendered directly below the title. When omitted, no
   * subtitle is shown.
   */
  subtitle?: string

  /**
   * Description text content
   */
  description: string

  /**
   * Call-to-action button text. When omitted, no CTA button is rendered.
   */
  ctaText?: string

  /**
   * Call-to-action button destination URL (used when `ctaText` is set).
   */
  ctaHref?: string

  /**
   * Feature image source URL
   */
  imageSrc: string

  /**
   * Image alternative text for accessibility
   */
  imageAlt: string

  /**
   * Image width in pixels (optional)
   * When provided with imageHeight, prevents layout shift during loading
   */
  imageWidth?: number

  /**
   * Image height in pixels (optional)
   * When provided with imageWidth, prevents layout shift during loading
   */
  imageHeight?: number

  /**
   * Nearest configured Cloudflare aspect ratio for the image. When set (and the
   * `imageSrc` is a Cloudflare URL), an optimized variant + srcset is fetched
   * instead of the full-resolution original. The image still renders at its
   * natural ratio (the ratio only selects the variant, not a cropping box).
   */
  imageAspectRatio?: AspectRatio

  /**
   * Text box position relative to image
   * - left: Text box on left, image on right (max 50% width on desktop)
   * - right: Text box on right, image on left (max 50% width on desktop)
   * @default 'left'
   */
  align?: 'left' | 'right'
}

/**
 * ContentTextBox displays a white content box with title, optional subtitle,
 * description, and CTA button that overlaps a tall feature image.
 *
 * Based on the `.cb-image-textbox` (left/right) pattern from wemeditate.com.
 * The white box overlays the image on desktop, creating visual depth.
 * Responsive: stacks vertically on mobile, overlapping layout on desktop.
 *
 * For text-over-image (the CMS `overlay` position) use `ContentOverlay`; for the
 * ornate "Ancient Wisdom" treatment use `OrnateTextBox`.
 *
 * @example
 * <ContentTextBox
 *   title="Get Connected"
 *   description="The experience of meditation is even stronger when it is shared!"
 *   ctaText="Classes near me"
 *   ctaHref="/classes"
 *   imageSrc="/images/meditation-class.jpg"
 *   imageAlt="Group meditation class"
 *   align="left"
 * />
 */
export function ContentTextBox({
  title,
  subtitle,
  description,
  ctaText,
  ctaHref,
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  imageAspectRatio,
  align = 'left',
  className = '',
  ...props
}: ContentTextBoxProps) {
  const wrapperClasses = align === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'
  const contentContainerClasses = align === 'right' ? 'lg:-mr-32 lg:ml-2' : 'lg:-ml-32 lg:mr-2'

  return (
    <div
      className={`
        relative
        my-24 lg:my-32
        lg:max-h-[700px]
        gap-6 lg:gap-0
        flex flex-col items-center ${wrapperClasses}
        justify-center
        ${className}
      `}
      {...props}
    >
      {/* Image - natural flow on mobile, positioned on desktop.
          Mobile: fill the column width, capped to a 1:1 aspect (height ≤ width, via
          the captured page width `--page-width` minus the page gutters) and
          `object-cover` so portrait images crop to ≤ square rather than running
          tall. Desktop (lg): the original contained, container-height behavior. */}
      <Image
        alt={imageAlt}
        aspectRatio={imageAspectRatio}
        className="w-full max-h-[calc(var(--page-width)-5rem)] lg:h-full lg:max-h-[85vh] lg:object-contain"
        forceAspectRatio={false}
        height={imageHeight}
        objectFit="cover"
        sizes="(max-width: 1024px) 100vw, 600px"
        src={imageSrc}
        width={imageWidth}
      />

      {/* Content - natural stack on mobile, positioned and centered on desktop */}
      <div className={`lg:z-10 ${contentContainerClasses}`}>
        {/* White box wrapper only on desktop */}
        <div className="flex flex-col gap-6 lg:bg-white lg:shadow-xl lg:p-20 lg:min-w-lg lg:max-w-xl">
          {/* Title + subtitle group (kept tight together) */}
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
            {subtitle && <p className="text-base font-light text-gray-700">{subtitle}</p>}
          </div>

          {/* Description */}
          <p className="text-lg font-light text-gray-700">{description}</p>

          {/* CTA Button (optional — needs both text and a destination) */}
          {ctaText && ctaHref && (
            <div>
              <Button className="mt-1" href={ctaHref} size="lg" variant="outline">
                {ctaText}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
