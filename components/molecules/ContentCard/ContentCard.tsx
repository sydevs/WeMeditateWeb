import { ComponentProps } from 'react'
import { PlayIcon } from '@heroicons/react/24/solid'
import { Image } from '../../atoms/Image/Image'
import { Link } from '../../Link'
import { Button } from '../../atoms/Button/Button'
import { Badge } from '../../atoms/Badge/Badge'

export interface ContentCardProps extends Omit<ComponentProps<'article'>, 'title'> {
  /**
   * Card title (required)
   */
  title: string

  /**
   * URL for the content (required for linking)
   */
  href: string

  /**
   * Thumbnail image URL
   */
  thumbnailSrc: string

  /**
   * Thumbnail image alt text (defaults to title if not provided)
   */
  thumbnailAlt?: string

  /**
   * Optional description text
   */
  description?: string

  /**
   * Aspect ratio for the thumbnail image
   * @default 'square'
   */
  aspectRatio?: 'square' | 'video' | '4/3' | '3/2' | '16/9' | '21/9'

  /**
   * Card variant
   * - default: Standard card with medium play button, normal title sizing
   * - hero: Larger card with large play button, bigger/bolder title
   * @default 'default'
   */
  variant?: 'default' | 'hero'

  /**
   * Show play button overlay
   * @default false
   */
  playButton?: boolean

  /**
   * Optional duration in minutes (displays in bottom left corner of thumbnail)
   */
  durationMinutes?: number

  /**
   * Locale for the link (defaults to current page locale from context)
   */
  locale?: string

  /**
   * Custom class name for the card container
   */
  className?: string
}

/**
 * ContentCard molecule - displays a content preview with thumbnail, title, and optional description.
 *
 * A simple group of atoms (Image, Link, Button, Text) that work together to preview content.
 * Used for previewing pages, meditations, and other content types.
 *
 * Features:
 * - Responsive thumbnail with configurable aspect ratio
 * - Optional play button overlay (for meditations/media)
 * - Title that's bold when no description is present
 * - Accessible with proper ARIA labels and semantic HTML
 * - Locale-aware linking
 *
 * @example
 * // Basic content card (default variant)
 * <ContentCard
 *   title="Feel Love"
 *   href="/meditations/love"
 *   thumbnailSrc="/images/meditation.jpg"
 *   description="Unconditional love sounds hard, but it's actually innate..."
 * />
 *
 * @example
 * // Meditation card with play button and duration
 * <ContentCard
 *   title="Feel Love"
 *   href="/meditations/love"
 *   thumbnailSrc="/images/meditation.jpg"
 *   playButton={true}
 *   durationMinutes={10}
 *   aspectRatio="video"
 * />
 *
 * @example
 * // Hero variant card (larger, always bold title)
 * <ContentCard
 *   title="About Meditation"
 *   href="/about"
 *   thumbnailSrc="/images/article.jpg"
 *   variant="hero"
 *   playButton={true}
 * />
 */
export function ContentCard({
  title,
  href,
  thumbnailSrc,
  thumbnailAlt,
  description,
  aspectRatio = 'square',
  variant = 'default',
  playButton = false,
  durationMinutes,
  locale,
  className = '',
  ...props
}: ContentCardProps) {
  const showPlayButton = playButton
  const isHeroVariant = variant === 'hero'

  // Determine play button size based on variant
  const playButtonSize = isHeroVariant ? 'lg' : 'md'

  // Determine default size based on variant
  // Hero variant uses aspect-ratio-aware width sizing to maintain constant ~384px height
  // Default variant uses fixed width: w-64 (16rem/256px)
  const getHeroWidth = () => {
    if (!isHeroVariant) return 'w-64'

    // Calculate width to achieve ~384px height for each aspect ratio
    const aspectRatioWidths = {
      'square': 'w-96',      // 1:1 → 384px
      'video': 'w-[682px]',  // 16:9 → 682px
      '16/9': 'w-[682px]',   // 16:9 → 682px
      '4/3': 'w-128',        // 4:3 → 512px
      '3/2': 'w-144',        // 3:2 → 576px
      '21/9': 'w-[896px]',   // 21:9 → 896px
    }

    return aspectRatioWidths[aspectRatio] || 'w-96' // default to square
  }

  const cardSize = getHeroWidth()

  // Determine title styling based on variant
  // Hero variant matches carousel__name: 24px (text-2xl), 600 weight (font-semibold)
  // Default variant uses normal styling
  const titleClasses = isHeroVariant
    ? 'text-2xl font-semibold'
    : 'text-base sm:text-lg font-normal'

  // Hero variant has larger gap between thumbnail and title (36px = gap-9)
  const contentGap = isHeroVariant ? 'gap-9' : 'gap-2'

  return (
    <article
      className={`group flex flex-col gap-3 ${cardSize} text-left ${className}`}
      {...props}
    >
      {/* Thumbnail with optional play button overlay */}
      <div className="relative">
        <Image
          src={thumbnailSrc}
          alt={thumbnailAlt || title}
          aspectRatio={aspectRatio}
          objectFit="cover"
          className="transition-opacity duration-200 group-hover:opacity-90"
        />

        {/* Play button overlay */}
        {showPlayButton && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              icon={PlayIcon}
              variant="primary"
              size={playButtonSize}
              shape="square"
              href={href}
              locale={locale}
              aria-label={`Play ${title}`}
              className="shadow-lg transition-transform duration-200 group-hover:scale-110"
            />
          </div>
        )}

        {/* Duration badge (bottom left corner) */}
        {durationMinutes !== undefined && (
          <div className="absolute bottom-2 left-2">
            <Badge
              color="primary"
              shape="circular"
            >
              {durationMinutes} min
            </Badge>
          </div>
        )}
      </div>

      {/* Content section */}
      <div className={`flex flex-col ${contentGap}`}>
        {/* Title - styling based on variant and description presence */}
        <h3 className={titleClasses}>
          <Link
            href={href}
            locale={locale}
            variant="unstyled"
            className={
              isHeroVariant
                ? 'text-gray-500 hover:text-teal-600 transition-colors duration-200'
                : 'text-gray-700 hover:text-teal-600 transition-colors duration-200'
            }
          >
            {title}
          </Link>
        </h3>

        {/* Optional description */}
        {description && (
          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </article>
  )
}
