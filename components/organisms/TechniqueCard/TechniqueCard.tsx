import { ComponentProps } from 'react'
import { Button, Heading, Image } from '../../atoms'

export interface TechniqueCardProps extends Omit<ComponentProps<'div'>, 'title'> {
  /**
   * Card number displayed above the content (e.g., "01", "02", "03")
   */
  number: string

  /**
   * Main heading/title of the technique
   */
  title: string

  /**
   * Description text explaining the technique
   */
  description: string

  /**
   * URL for the technique image
   */
  imageSrc: string

  /**
   * Alt text for the image
   */
  imageAlt: string

  /**
   * Link destination for "Learn more" button
   */
  href: string

  /**
   * Button text
   */
  buttonText: string

  /**
   * Layout alignment - determines image position
   * @default 'left'
   */
  align?: 'left' | 'right'
}

/**
 * TechniqueCard displays meditation technique information
 * with an image, title, description, and call-to-action button.
 *
 * Features alternating left/right image layouts for visual variety.
 */
export function TechniqueCard({
  number,
  title,
  description,
  imageSrc,
  imageAlt,
  href,
  buttonText = 'Learn more',
  align = 'left',
  className = '',
  ...props
}: TechniqueCardProps) {
  return (
    <div
      className={`
        relative flex flex-col items-center gap-8
        md:flex-row md:items-center md:gap-7 xl:gap-14
        ${align === 'right' ? 'md:flex-row-reverse' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Image with gradient overlay and number */}
      <div className="relative w-full max-w-md shrink-0 md:w-84 lg:w-96">
        {/* Gradient overlay - positioned above image */}
        <div
          className={`
            absolute bottom-full hidden h-28 w-56
            from-transparent to-teal-200/30
            md:flex md:items-center
            px-4
            ${align === 'right' ? '-right-4 bg-linear-to-l md:justify-end' : '-left-4 bg-linear-to-r md:justify-start'}
          `}
          aria-hidden="true"
        >
          {/* Number Badge - centered within gradient */}
          <div className="text-4xl font-light text-gray-400">
            {number}
          </div>
        </div>

        {/* Mobile Number Badge - shown on mobile only */}
        <div className="mb-4 text-4xl font-light text-gray-400 md:hidden" aria-hidden="true">
          {number}
        </div>

        {/* Image */}
        <Image
          src={imageSrc}
          alt={imageAlt}
          aspectRatio="square"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Content */}
      <div
        className={`
          flex max-w-lg flex-col text-left
          md:px-10 lg:px-12
        `}
      >
        <Heading level="h3" styleAs="h5" className="mb-4 text-gray-700">
          {title}
        </Heading>

        <p className="mb-10 text-gray-700 text-lg md:text-base">
          {description}
        </p>

        <div>
          <Button
            variant="outline"
            size="md"
            href={href}
            className="min-w-[140px]"
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  )
}
