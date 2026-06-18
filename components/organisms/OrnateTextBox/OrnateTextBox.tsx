import { ComponentProps } from 'react'
import { Button, Image } from '../../atoms'
import { SimpleLeafSvg } from '../../atoms/svgs'

export interface OrnateTextBoxProps extends Omit<ComponentProps<'div'>, 'title'> {
  /**
   * Main heading/title
   */
  title: string

  /**
   * Secondary line rendered directly below the title (visually faded but
   * high-contrast). When omitted, no subtitle is shown.
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
   * Image width in pixels (optional). With imageHeight, prevents layout shift.
   */
  imageWidth?: number

  /**
   * Image height in pixels (optional). With imageWidth, prevents layout shift.
   */
  imageHeight?: number

  /**
   * Image position (the text sits on the opposite side on desktop).
   * @default 'left'
   */
  align?: 'left' | 'right'

  /**
   * Decorative vertical label rendered along the image-side edge (desktop
   * only). Purely ornamental. @default 'Ancient Wisdom'
   */
  sidetext?: string
}

/**
 * OrnateTextBox is the decorative "Ancient Wisdom" treatment for a feature
 * image + text block. It mirrors wemeditate.com's `.cb-image-textbox--ornate`:
 * a warm parchment surface with a soft warm gradient blending the image into
 * the copy, faint botanical leaf flourishes, and a faded vertical sidetext
 * label along the outer edge.
 *
 * Reuses the `Image` and `Button` atoms and the `SimpleLeafSvg` ornament. The
 * live site's scattered botanical motifs live in a raster background image; here
 * they're reproduced with the `bg-warm` token plus the existing leaf SVG so the
 * treatment stays within the design system.
 *
 * Mobile-first: stacks vertically on mobile, two columns on desktop.
 *
 * @example
 * <OrnateTextBox
 *   title="A Mother's Love"
 *   subtitle="Timeless teachings"
 *   description="In every culture and religion, one can find great tales…"
 *   imageSrc="/images/durga.jpg"
 *   imageAlt="Goddess Durga"
 *   align="left"
 * />
 */
export function OrnateTextBox({
  title,
  subtitle,
  description,
  ctaText,
  ctaHref,
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  align = 'left',
  sidetext = 'Ancient Wisdom',
  className = '',
  ...props
}: OrnateTextBoxProps) {
  const imageOnRight = align === 'right'

  return (
    <div className={`relative isolate overflow-hidden bg-warm ${className}`} {...props}>
      {/* Warm gradient blending the image into the copy (toward the text side) */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${
          imageOnRight
            ? 'bg-linear-to-l from-coral-100/40 to-transparent'
            : 'bg-linear-to-r from-coral-100/40 to-transparent'
        }`}
      />

      {/* Faint botanical flourishes echoing the ornate background */}
      <SimpleLeafSvg
        aria-hidden="true"
        className="pointer-events-none absolute top-6 right-8 h-12 w-12 -rotate-12 text-teal-700/15"
      />
      <SimpleLeafSvg
        aria-hidden="true"
        className="pointer-events-none absolute bottom-8 left-10 h-10 w-10 rotate-45 text-teal-700/15"
      />

      {/* Decorative vertical label along the image-side edge (desktop only) */}
      {sidetext && (
        <span
          aria-hidden="true"
          className={`absolute top-1/2 hidden -translate-y-1/2 rotate-180 select-none text-sm font-light uppercase tracking-[0.2em] text-gray-500 [writing-mode:vertical-rl] md:block ${
            imageOnRight ? 'right-3' : 'left-3'
          }`}
        >
          {sidetext}
        </span>
      )}

      {/* Content */}
      <div
        className={`relative flex flex-col items-center gap-8 p-8 lg:gap-12 lg:p-16 ${
          imageOnRight ? 'lg:flex-row-reverse' : 'lg:flex-row'
        }`}
      >
        <Image
          alt={imageAlt}
          className="max-h-[60vh] w-full lg:w-1/2"
          height={imageHeight}
          objectFit="contain"
          src={imageSrc}
          width={imageWidth}
        />

        <div className="flex w-full flex-col gap-6 lg:w-1/2">
          {/* Title + subtitle group (kept tight together) */}
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-base font-light text-gray-800">{subtitle}</p>}
          </div>

          <p className="text-lg font-light leading-relaxed text-gray-800">{description}</p>

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
