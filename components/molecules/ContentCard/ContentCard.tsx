import { ComponentProps, useState } from 'react'
import { PlayIcon } from '@heroicons/react/24/solid'
import { Image } from '../../atoms/Image/Image'
import { Link } from '../../atoms/Link'
import { Button } from '../../atoms/Button/Button'
import { Duration } from '../../atoms/Duration/Duration'
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
   * Optional badge text (e.g., category name, displayed next to duration badge)
   */
  badge?: string

  /**
   * Optional URL for the badge link
   */
  badgeUrl?: string

  /**
   * Locale for the link (defaults to current page locale from context)
   */
  locale?: string

  /**
   * Enable fade-in animation when image loads
   * @default false
   */
  fadeInOnLoad?: boolean

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
  badge,
  badgeUrl,
  locale,
  fadeInOnLoad = false,
  className = '',
  ...props
}: ContentCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const showPlayButton = playButton
  const isHeroVariant = variant === 'hero'

  // Determine play button size based on variant
  const playButtonSize = isHeroVariant ? 'lg' : 'md'

  // Cards always fill their column width
  const cardSize = 'w-full'

  // Determine title styling based on variant
  // Hero variant matches carousel__name with responsive sizing
  // Default variant uses normal styling
  const titleClasses = isHeroVariant
    ? 'text-xl sm:text-2xl font-semibold'
    : 'text-base sm:text-lg font-normal'

  // Hero variant has larger gap between thumbnail and title (responsive)
  const contentGap = isHeroVariant ? 'gap-6 sm:gap-9' : 'gap-2'

  // Build opacity classes based on fadeInOnLoad prop
  const opacityClasses = fadeInOnLoad
    ? `transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`
    : ''

  return (
    <article
      className={`group flex flex-col gap-2 sm:gap-3 ${cardSize} text-left ${opacityClasses} ${className}`}
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
          onLoad={fadeInOnLoad ? () => setImageLoaded(true) : undefined}
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

        {/* Badges (bottom left corner) */}
        {(durationMinutes !== undefined || badge) && (
          <div className="absolute bottom-2 left-2 flex gap-2">
            {durationMinutes !== undefined && (
              <Badge
                color="primary"
                shape="circular"
              >
                {durationMinutes} min
              </Badge>
            )}
            {badge && (
              <Badge
                color="secondary"
                shape="circular"
                href={badgeUrl}
              >
                {badge}
              </Badge>
            )}
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
            size="inherit"
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
