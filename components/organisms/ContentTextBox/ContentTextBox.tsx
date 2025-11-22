import { ComponentProps } from 'react'
import { Button, Heading, Image } from '../../atoms'

export interface ContentTextBoxProps extends Omit<ComponentProps<'div'>, 'title'> {
  /**
   * Main heading/title
   */
  title: string

  /**
   * Description text content
   */
  description: string

  /**
   * Call-to-action button text
   */
  ctaText: string

  /**
   * Call-to-action button destination URL
   */
  ctaHref: string

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
   * - center: Text box centered over image
   * - right: Text box on right, image on left (max 50% width on desktop)
   * @default 'left'
   */
  align?: 'left' | 'center' | 'right'
}

/**
 * ContentTextBox displays a white content box with title, description,
 * and CTA button that overlaps a tall feature image.
 *
 * Based on the .cb-image-textbox--dark pattern from wemeditate.com.
 * The white box overlays the image on desktop, creating visual depth.
 * Responsive: stacks vertically on mobile, overlapping layout on desktop.
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
  description,
  ctaText,
  ctaHref,
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  align = 'left',
  className = '',
  ...props
}: ContentTextBoxProps) {
  // Content container positioning based on alignment (desktop only)
  // Uses flex to center content vertically and position horizontally
  const wrapperClasses =
    align === 'left' ? 'lg:flex-row' :
    align === 'right' ? 'lg:flex-row-reverse' :
    '' // center

  // Content container positioning based on alignment (desktop only)
  // Uses flex to center content vertically and position horizontally
  const contentContainerClasses =
    align === 'left' ? 'lg:-ml-32 lg:mr-2' :
    align === 'right' ? 'lg:-mr-32 lg:ml-2' :
    'lg:absolute lg:inset-0 lg:flex lg:items-center lg:justify-center' // center

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
        src={imageSrc}
        alt={imageAlt}
        width={imageWidth}
        height={imageHeight}
        className='w-full max-h-[min(70vh,100vw)] lg:h-full lg:max-h-[85vh]'
        objectFit={align === 'center' ? "cover" : "contain"}
      />

      {/* Content - natural stack on mobile, positioned and centered on desktop */}
      <div className={`lg:z-10 ${contentContainerClasses}`}>
        {/* White box wrapper only on desktop */}
        <div className="flex flex-col gap-6 lg:bg-white lg:shadow-xl lg:p-20 lg:min-w-lg lg:max-w-xl">
          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-800">
            {title}
          </h2>

          {/* Description */}
          <p className="text-lg font-light text-gray-700">
            {description}
          </p>

          {/* CTA Button */}
          <div>
            <Button
              href={ctaHref}
              variant="outline"
              size="lg"
              className="mt-1"
            >
              {ctaText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
