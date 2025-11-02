import React from 'react'
import { Button, Image } from '../../atoms'

export interface TechniqueCardProps {
  /** Technique number badge (e.g., "02", "03") */
  number: string
  /** Technique title */
  title: string
  /** Technique description */
  description: string
  /** Button text (default: "Learn more") */
  buttonText?: string
  /** Button click handler */
  onButtonClick?: () => void
  /** Image source URL */
  imageSrc: string
  /** Image alt text */
  imageAlt: string
  /** Card alignment - controls image and content positioning */
  align?: 'left' | 'right'
}

/**
 * TechniqueCard component displays a technique with image, title, description, and call-to-action.
 * Based on the `.excerpt` elements from wemeditate.com/techniques.
 *
 * Features:
 * - Left or right alignment with image/content swap
 * - Numbered badge with large gradient background
 * - Responsive: stacks vertically on mobile, horizontal on desktop
 * - All text is left-aligned (no center alignment on mobile)
 * - Square aspect ratio images
 *
 * @example
 * ```tsx
 * <TechniqueCard
 *   number="02"
 *   title="Foot Soak"
 *   description="Simple and inexpensive, soaking your feet in saltwater..."
 *   imageSrc="/images/foot-soak.jpg"
 *   imageAlt="Person soaking feet"
 *   align="left"
 *   onButtonClick={() => console.log('Learn more clicked')}
 * />
 * ```
 */
export const TechniqueCard = ({
  number,
  title,
  description,
  buttonText = 'Learn more',
  onButtonClick,
  imageSrc,
  imageAlt,
  align = 'left',
}: TechniqueCardProps) => {
  // Gradient positioning based on alignment - extends across large portion of card
  const gradientClasses = {
    left: 'before:top-0 before:right-0 before:h-64 before:w-80 before:bg-gradient-to-l md:before:h-96 md:before:w-[500px]',
    right: 'before:top-0 before:left-0 before:h-64 before:w-80 before:bg-gradient-to-r md:before:h-96 md:before:w-[500px]',
  }

  // Number positioning based on alignment - outside the content flow
  const numberPositionClasses = {
    left: 'top-0 right-0 text-right pr-6 md:pr-12',
    right: 'top-0 left-0 text-left pl-6 md:pl-12',
  }

  // Content order: image first on mobile, then swap based on alignment on desktop
  const contentOrderClasses = {
    left: 'flex-col md:flex-row',
    right: 'flex-col md:flex-row-reverse',
  }

  return (
    <div className="relative mx-auto max-w-7xl">
      {/* Large gradient background layer */}
      <div
        className={`
          pointer-events-none absolute
          before:absolute before:from-transparent before:to-teal-200/30
          before:content-['']
          ${gradientClasses[align]}
        `}
      />

      {/* Number badge - positioned outside content flow */}
      <div className={`absolute ${numberPositionClasses[align]} z-10 pt-2`}>
        <span className="font-raleway text-7xl font-extralight text-gray-300 md:text-8xl">
          {number}
        </span>
      </div>

      {/* Main content container */}
      <div className={`flex ${contentOrderClasses[align]} items-center gap-12 md:gap-16`}>
        {/* Image section - square aspect ratio */}
        <div className="w-full md:w-1/2">
          <div className="aspect-square w-full overflow-hidden">
            <Image
              src={imageSrc}
              alt={imageAlt}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Content section - always left-aligned */}
        <div className="w-full space-y-6 md:w-1/2">
          <h2 className="font-raleway text-3xl font-normal text-gray-600 md:text-4xl">
            {title}
          </h2>

          <p className="text-base leading-relaxed text-gray-600">
            {description}
          </p>

          <div>
            <Button
              variant="outline"
              onClick={onButtonClick}
            >
              {buttonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
