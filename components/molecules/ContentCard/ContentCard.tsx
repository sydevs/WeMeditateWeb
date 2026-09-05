import { ComponentProps, useState } from 'react'
import { PlayIcon } from '@heroicons/react/24/solid'
import { Image } from '../../atoms/Image/Image'
import { Link } from '../../atoms/Link'
import { Button } from '../../atoms/Button/Button'
import { Badge } from '../../atoms/Badge/Badge'
import { Placeholder } from '../../atoms/Placeholder/Placeholder'
import { Logo } from '../../atoms/graphics/Logo/Logo'
import type { AspectRatio } from '../../../lib/cloudflare-images'

export interface ContentCardProps extends Omit<ComponentProps<'article'>, 'title'> {
  /**
   * Card title.
   */
  title: string

  /**
   * URL for the content. The title and play button link here.
   */
  href: string

  /**
   * Thumbnail image URL.
   */
  thumbnailSrc: string

  /**
   * Thumbnail alt text. Defaults to the title.
   */
  thumbnailAlt?: string

  /**
   * Optional description text.
   */
  description?: string

  /**
   * Aspect ratio for the thumbnail image.
   * @default 'square'
   */
  aspectRatio?: AspectRatio

  /**
   * Render the thumbnail at a fixed height with its natural width (a
   * Tailwind height class, for example `'h-56 sm:h-64'`) instead of a fixed aspect
   * ratio. A row of cards can then share one image height while each image
   * keeps its own proportions. This ignores `aspectRatio` when set.
   */
  imageHeight?: string

  /**
   * Card variant.
   * - default: standard card, medium play button, normal title size
   * - hero: larger card, large play button, bigger and bolder title
   * @default 'default'
   */
  variant?: 'default' | 'hero'

  /**
   * Show a play button overlay.
   * @default false
   */
  playButton?: boolean

  /**
   * Optional duration in minutes. Shows in the bottom-left corner of the thumbnail.
   */
  durationMinutes?: number

  /**
   * Optional badge text, for example a category name. Shows next to the duration badge.
   */
  badge?: string

  /**
   * Optional URL for the badge link.
   */
  badgeUrl?: string

  /**
   * Locale for the link. Defaults to the current page locale from context.
   */
  locale?: string

  /**
   * Fade the image in when it loads.
   * @default false
   */
  fadeInOnLoad?: boolean

  /**
   * Custom class name for the card container.
   */
  className?: string
}

/**
 * ContentCard is a molecule. It shows a content preview: a thumbnail, a
 * title, and an optional description. Use it to preview pages, meditations,
 * and other content types.
 *
 * Features:
 * - Responsive thumbnail with a configurable aspect ratio
 * - Optional play button overlay, for meditations or other media
 * - Bold title when no description is present
 * - Proper ARIA labels and semantic HTML
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
  imageHeight,
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
  // A card with no loadable image renders a placeholder, not an <img>. Its
  // onLoad event never fires, so fadeInOnLoad would leave the card stuck at
  // opacity-0. Start "loaded" when there is no image src to wait for.
  const hasImageSrc = thumbnailSrc.length > 0
  const [imageLoaded, setImageLoaded] = useState(!hasImageSrc)
  const showPlayButton = playButton
  const isHeroVariant = variant === 'hero'

  const playButtonSize = isHeroVariant ? 'lg' : 'md'

  // Cards fill their column width. A fixed image height overrides this, so
  // the card sizes to the image's natural width instead.
  const cardSize = imageHeight ? 'w-auto' : 'w-full'

  const titleClasses = isHeroVariant
    ? 'text-xl sm:text-2xl font-semibold'
    : 'text-base sm:text-lg font-normal'

  // The hero variant uses a larger gap between the thumbnail and the title.
  const contentGap = isHeroVariant ? 'gap-6 sm:gap-9' : 'gap-2'

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
        {hasImageSrc ? (
          <Image
            alt={thumbnailAlt || title}
            aspectRatio={imageHeight ? undefined : aspectRatio}
            className={`transition-opacity duration-200 group-hover:opacity-90 ${imageHeight ? `${imageHeight} w-auto` : ''}`}
            objectFit="cover"
            src={thumbnailSrc}
            onError={fadeInOnLoad ? () => setImageLoaded(true) : undefined}
            onLoad={fadeInOnLoad ? () => setImageLoaded(true) : undefined}
          />
        ) : (
          // No CMS thumbnail. Show a branded, non-animated fallback in a
          // fixed 16:9 box, so imageless cards look consistent in the grid.
          <div className="relative aspect-video overflow-hidden rounded-xs">
            <Placeholder animate={false} variant="primary">
              <Logo className="text-white" size="xl" variant="icon" />
            </Placeholder>
          </div>
        )}

        {/* Play button overlay */}
        {showPlayButton && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              aria-label={`Play ${title}`}
              className="shadow-lg transition-transform duration-200 group-hover:scale-110"
              href={href}
              icon={PlayIcon}
              locale={locale}
              shape="square"
              size={playButtonSize}
              variant="primary"
            />
          </div>
        )}

        {/* Badges (bottom left corner) */}
        {(durationMinutes !== undefined || badge) && (
          <div className="absolute bottom-2 left-2 flex gap-2">
            {durationMinutes !== undefined && (
              <Badge color="primary" shape="circular">
                {durationMinutes} min
              </Badge>
            )}
            {badge && (
              <Badge color="secondary" href={badgeUrl} shape="circular">
                {badge}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Content section. In fixed-image-height mode the card sizes to the
          image's natural width. `w-0 min-w-full` constrains the text to that
          width, so a wide title cannot stretch the card. */}
      <div className={`flex flex-col ${contentGap} ${imageHeight ? 'w-0 min-w-full' : ''}`}>
        {/* Title style depends on the variant. */}
        <h3 className={`${titleClasses} wrap-break-word`}>
          <Link
            className={
              isHeroVariant
                ? 'text-gray-500 hover:text-teal-600 transition-colors duration-200'
                : 'text-gray-700 hover:text-teal-600 transition-colors duration-200'
            }
            href={href}
            locale={locale}
            size="inherit"
            variant="unstyled"
          >
            {title}
          </Link>
        </h3>

        {/* Optional description */}
        {description && (
          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{description}</p>
        )}
      </div>
    </article>
  )
}
