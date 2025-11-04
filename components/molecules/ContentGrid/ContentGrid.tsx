import { ComponentProps } from 'react'
import Masonry from 'react-masonry-css'
import { ContentCard, ContentCardProps } from '../ContentCard/ContentCard'

export interface ContentGridItem extends Omit<ContentCardProps, 'className' | 'id'> {
  /** Unique identifier for the item */
  id: string | number
}

export interface ContentGridProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Array of content items to display in the grid */
  items: ContentGridItem[]
  /** Card variant to apply to all cards in the grid */
  cardVariant?: 'default' | 'hero'
  /** Custom breakpoints for responsive columns (defaults to 1 mobile, 2 tablet, 3 desktop) */
  breakpointCols?: number | { default: number; [key: number]: number }
}

/**
 * ContentGrid molecule displays ContentCard components in a responsive masonry layout.
 *
 * Similar to MasonryGrid but composes ContentCard components instead of plain text items.
 * Always displays all cards without pagination or "Show More" functionality.
 *
 * @example
 * // Basic usage with meditation cards
 * <ContentGrid
 *   items={[
 *     {
 *       id: 1,
 *       title: "Feel Love",
 *       href: "/meditations/love",
 *       thumbnailSrc: "/images/meditation1.jpg",
 *       playButton: true,
 *       durationMinutes: 10
 *     },
 *     {
 *       id: 2,
 *       title: "Morning Peace",
 *       href: "/meditations/peace",
 *       thumbnailSrc: "/images/meditation2.jpg",
 *       description: "Start your day with calm...",
 *       playButton: true
 *     }
 *   ]}
 * />
 *
 * @example
 * // Custom breakpoints (2 columns mobile, 3 tablet, 4 desktop)
 * <ContentGrid
 *   items={contentItems}
 *   breakpointCols={{
 *     default: 4,
 *     1280: 3,
 *     768: 2,
 *     640: 2
 *   }}
 * />
 */
export function ContentGrid({
  items,
  cardVariant = 'default',
  breakpointCols = {
    default: 3,  // Desktop: 3 columns (1024px+)
    1023: 2,     // Tablet: 2 columns (640px - 1023px)
    639: 1,      // Mobile: 1 column (< 640px)
  },
  className = '',
  ...props
}: ContentGridProps) {
  // Determine gap size based on variant
  // Default: 16px mobile, 20px tablet, 24px desktop
  // Hero: 24px mobile, 30px tablet, 36px desktop (50% larger)
  const isHero = cardVariant === 'hero'
  const gapClasses = isHero
    ? '-ml-6 sm:-ml-[1.875rem] lg:-ml-9'  // 24px, 30px, 36px
    : '-ml-4 sm:-ml-5 lg:-ml-6'           // 16px, 20px, 24px
  const columnGapClasses = isHero
    ? 'pl-6 sm:pl-[1.875rem] lg:pl-9'     // 24px, 30px, 36px
    : 'pl-4 sm:pl-5 lg:pl-6'              // 16px, 20px, 24px

  return (
    <div className={`flex justify-center w-full ${className}`} {...props}>
      <Masonry
        breakpointCols={breakpointCols}
        className={`flex ${gapClasses} max-w-full`}
        columnClassName={`${columnGapClasses} bg-clip-padding`}
      >
        {items.map((item) => {
          const { id, ...cardProps } = item
          return (
            <div key={id} className="mb-8 flex justify-center">
              <ContentCard {...cardProps} variant={cardVariant} fadeInOnLoad={true} />
            </div>
          )
        })}
      </Masonry>
    </div>
  )
}
