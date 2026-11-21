import { ComponentProps } from 'react'
import { Button, Heading, Image } from '../../atoms'
import { useT } from '../../../hooks/useT'
import type { AspectRatio } from '../../../lib/cloudflare-images'

export interface TechniqueCardProps extends Omit<ComponentProps<'div'>, 'title'> {
  /**
   * Card number displayed above the content, for example "01", "02", "03".
   * Omit it for a card that stands alone, where a sequence number means nothing.
   */
  number?: string

  /** Main heading of the technique */
  title: string

  /**
   * The heading's place in the page outline. It draws the same size at every level.
   * @default 'h3'
   */
  headingLevel?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

  /** Description text explaining the technique. A line break in it renders as one. */
  description: string

  /** URL for the technique image */
  imageSrc: string

  /** Alt text for the image */
  imageAlt: string

  /**
   * The box the image is cropped to.
   * @default 'square'
   */
  imageAspectRatio?: AspectRatio

  /** Link destination for the "Learn more" button */
  href: string

  /**
   * Layout alignment. Determines the image position.
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
  headingLevel = 'h3',
  description,
  imageSrc,
  imageAlt,
  imageAspectRatio = 'square',
  href,
  align = 'left',
  className = '',
  ...props
}: TechniqueCardProps) {
  const t = useT()

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
          aria-hidden="true"
          className={`
            absolute bottom-full hidden h-28 w-56
            from-transparent to-teal-200/30
            md:flex md:items-center
            px-4
            ${align === 'right' ? '-right-4 bg-linear-to-l md:justify-end' : '-left-4 bg-linear-to-r md:justify-start'}
          `}
        >
          {/* Number Badge - centered within gradient */}
          {number && <div className="text-4xl font-light text-gray-400">{number}</div>}
        </div>

        {/* Mobile Number Badge - shown on mobile only */}
        {number && (
          <div aria-hidden="true" className="mb-4 text-4xl font-light text-gray-400 md:hidden">
            {number}
          </div>
        )}

        {/* Image */}
        <Image
          alt={imageAlt}
          aspectRatio={imageAspectRatio}
          className="h-full w-full object-cover"
          // One length per step of the wrapper above: `w-full max-w-md`,
          // then `md:w-84`, then `lg:w-96`.
          sizes="(min-width: 1024px) 384px, (min-width: 768px) 336px, (min-width: 448px) 448px, 100vw"
          src={imageSrc}
        />
      </div>

      {/* Content */}
      <div
        className={`
          flex max-w-lg flex-col text-left
          md:px-10 lg:px-12
        `}
      >
        <Heading className="mb-4 text-gray-700" level={headingLevel} styleAs="h5">
          {title}
        </Heading>

        <p className="mb-10 whitespace-pre-line text-gray-700 text-lg md:text-base">
          {description}
        </p>

        <div>
          <Button
            // Cards in a list share one visible label, so each names its own page.
            aria-label={t('blocks.a11y.learn_more_about', { title })}
            className="min-w-[140px]"
            href={href}
            size="md"
            variant="outline"
          >
            {t('blocks.general.learn_more')}
          </Button>
        </div>
      </div>
    </div>
  )
}
