import { ComponentProps } from 'react'
import { Button, Image } from '../../atoms'
import { FloralDividerSvg } from '../../atoms/svgs'

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
   * Text box position relative to image
   * - left: Text box on left, image on right (max 50% width on desktop)
   * - center: Text rendered directly over the image (overlay mode)
   * - right: Text box on right, image on left (max 50% width on desktop)
   * @default 'left'
   */
  align?: 'left' | 'center' | 'right'

  /**
   * Background context for the text, used **only** in overlay (`align="center"`)
   * mode where the text sits over the image. Mirrors the convention used by
   * `Splash`:
   * - light: dark text, for light backgrounds (default)
   * - dark: white text, for dark backgrounds
   *
   * A text-shadow glow is applied in both cases so the text stays legible over
   * an arbitrary image (WCAG 2.1 AA). Ignored in `left`/`right` modes, where the
   * text lives in its own box.
   * @default 'light'
   */
  theme?: 'light' | 'dark'

  /**
   * Apply the decorative "Ancient Wisdom" treatment: a warm parchment box with a
   * floral divider ornament above a centered title. Takes effect **only** in the
   * `left`/`right` side layouts; ignored in overlay (`align="center"`) mode.
   * @default false
   */
  wisdomStyle?: boolean
}

/**
 * ContentTextBox pairs a tall feature image with a content block (title,
 * optional subtitle, description, and CTA).
 *
 * Based on the `.cb-image-textbox` pattern from wemeditate.com. In the `left`
 * and `right` layouts the white content box overlaps the image on desktop,
 * creating visual depth; in `center` (overlay) mode the text is rendered
 * directly over the image. Responsive: stacks/centers on mobile, overlapping
 * layout on desktop.
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
  align = 'left',
  theme = 'light',
  wisdomStyle = false,
  className = '',
  ...props
}: ContentTextBoxProps) {
  const cta = ctaText && ctaHref && (
    <div>
      <Button className="mt-1" href={ctaHref} size="lg" variant="outline">
        {ctaText}
      </Button>
    </div>
  )

  // Overlay mode: text rendered directly over the image, with theme-driven
  // colour and a glow for legibility (WCAG AA over an arbitrary image).
  if (align === 'center') {
    const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900'
    const glow = theme === 'dark' ? 'text-glow-dark' : 'text-glow-light'

    return (
      <div className={`relative ${className}`} {...props}>
        <Image
          alt={imageAlt}
          className="w-full max-h-[min(70vh,100vw)] lg:max-h-[85vh]"
          height={imageHeight}
          objectFit="cover"
          src={imageSrc}
          width={imageWidth}
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-6 text-center">
          <h2 className={`text-2xl font-semibold ${textColor} ${glow}`}>{title}</h2>
          {subtitle && <p className={`text-xl font-normal ${textColor} ${glow}`}>{subtitle}</p>}
          <p className={`text-lg font-light ${textColor} ${glow}`}>{description}</p>
          {cta}
        </div>
      </div>
    )
  }

  // Side layouts (left/right). The image sits on one side and the box overlaps
  // it on desktop.
  const wrapperClasses = align === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'
  const contentContainerClasses = align === 'right' ? 'lg:-mr-32 lg:ml-2' : 'lg:-ml-32 lg:mr-2'

  // Ancient Wisdom: warm parchment box with a floral ornament and centered text,
  // visible at every breakpoint. The default box is white and only "boxed" on
  // desktop.
  const boxClasses = wisdomStyle
    ? 'flex flex-col items-center gap-6 text-center bg-warm p-10 shadow-md lg:p-20 lg:shadow-xl lg:min-w-lg lg:max-w-xl'
    : 'flex flex-col gap-6 lg:bg-white lg:shadow-xl lg:p-20 lg:min-w-lg lg:max-w-xl'

  return (
    <div
      className={`
        relative
        lg:max-h-[700px]
        gap-6 lg:gap-0
        flex flex-col items-center ${wrapperClasses}
        justify-center
        ${className}
      `}
      {...props}
    >
      {/* Image - natural flow on mobile, positioned on desktop */}
      <Image
        alt={imageAlt}
        className="w-full max-h-[min(70vh,100vw)] lg:h-full lg:max-h-[85vh]"
        height={imageHeight}
        objectFit="contain"
        src={imageSrc}
        width={imageWidth}
      />

      {/* Content - natural stack on mobile, positioned and centered on desktop */}
      <div className={`lg:z-10 ${contentContainerClasses}`}>
        <div className={boxClasses}>
          {/* Ancient Wisdom ornament */}
          {wisdomStyle && <FloralDividerSvg className="w-40 h-auto text-teal-500" />}

          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>

          {/* Subtitle (optional) — darker on the warm parchment for AA contrast */}
          {subtitle && (
            <p className={`text-xl font-normal ${wisdomStyle ? 'text-gray-800' : 'text-gray-700'}`}>
              {subtitle}
            </p>
          )}

          {/* Description */}
          <p className={`text-lg font-light ${wisdomStyle ? 'text-gray-800' : 'text-gray-700'}`}>
            {description}
          </p>

          {/* CTA Button (optional — needs both text and a destination) */}
          {cta}
        </div>
      </div>
    </div>
  )
}
