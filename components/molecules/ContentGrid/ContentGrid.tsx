import { ComponentProps } from 'react'
import Masonry from 'react-masonry-css'
import {
  ContentCard,
  ContentCardProps,
  ItemHeadingLevel,
} from '@/components/molecules/ContentCard/ContentCard'

export interface ContentGridItem extends Omit<
  ContentCardProps,
  'className' | 'id' | 'sizes' | 'headingLevel'
> {
  /** Unique identifier for the item */
  id: string | number
  /** `sizes` for this item's thumbnail. Overrides the grid's own. */
  sizes?: string
}

export interface ContentGridProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Array of content items to display in the grid */
  items: ContentGridItem[]
  /**
   * `sizes` for every card's thumbnail, describing one column of this grid.
   *
   * The caller's, not the grid's: a column is `(container + gutter) / n −
   * gutter`, and only the caller knows the container it put the grid in, or
   * the `breakpointCols` it passed (#206).
   */
  sizes: string
  /** Card variant to apply to all cards in the grid */
  cardVariant?: 'default' | 'hero'
  /** Custom breakpoints for responsive columns (defaults to 1 mobile, 2 tablet, 3 desktop) */
  breakpointCols?: number | { default: number; [key: number]: number }

  /**
   * The heading level every card title takes. A grid that is a page's whole
   * content sits under its `<h1>` and wants `h2`; the default suits a grid
   * under a section heading.
   * @default 'h3'
   */
  headingLevel?: ItemHeadingLevel
}

/**
 * ContentGrid molecule displays ContentCard components in a responsive masonry layout.
 *
 * Similar to MasonryGrid but composes ContentCard components instead of plain text items.
 * Always displays all cards without pagination or "Show More" functionality.
 *
 * The outer `w-full` div takes the spread props, `ref` among them, and that is
 * a contract: ContentIndex animates that element. Moving the spread onto the
 * Masonry breaks the fade and its spec silently.
 *
 * @example
 * // Basic usage with meditation cards
 * <ContentGrid
 *   sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 360px"
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
 *   sizes="(max-width: 639px) 50vw, (max-width: 1279px) 33vw, 270px"
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
  sizes,
  cardVariant = 'default',
  headingLevel,
  breakpointCols = {
    default: 3, // Desktop: 3 columns (1024px+)
    1023: 2, // Tablet: 2 columns (640px - 1023px)
    639: 1, // Mobile: 1 column (< 640px)
  },
  className = '',
  ...props
}: ContentGridProps) {
  // Determine gap size based on variant
  // Default: 16px mobile, 20px tablet, 24px desktop
  // Hero: 24px mobile, 30px tablet, 36px desktop (50% larger)
  const isHero = cardVariant === 'hero'
  const gapClasses = isHero
    ? '-ml-6 sm:-ml-[1.875rem] lg:-ml-9' // 24px, 30px, 36px
    : '-ml-4 sm:-ml-5 lg:-ml-6' // 16px, 20px, 24px
  const columnGapClasses = isHero
    ? 'pl-6 sm:pl-[1.875rem] lg:pl-9' // 24px, 30px, 36px
    : 'pl-4 sm:pl-5 lg:pl-6' // 16px, 20px, 24px

  return (
    // The Masonry must fill this wrapper, not act as a shrink-to-fit flex
    // child: react-masonry-css sizes each column to 100%/columns, so a
    // content-collapsed container makes its columns, and their cards,
    // collapse to the cards' min-content, for example the title. A plain
    // block wrapper, with w-full Masonry, keeps columns at a consistent
    // fraction of the available width, regardless of item count.
    <div className={`w-full ${className}`} {...props}>
      <Masonry
        breakpointCols={breakpointCols}
        className={`flex ${gapClasses} w-full`}
        columnClassName={`${columnGapClasses} bg-clip-padding`}
      >
        {items.map((item) => {
          const { id, sizes: itemSizes, ...cardProps } = item

          return (
            <div key={id} className="mb-8 flex justify-center">
              {/* `??`, not a pre-spread default: an item built by spreading a
                  wider shape can carry an explicit `sizes: undefined`, which
                  a spread would hand on as the card's own (#206). */}
              <ContentCard
                {...cardProps}
                headingLevel={headingLevel}
                sizes={itemSizes ?? sizes}
                variant={cardVariant}
              />
            </div>
          )
        })}
      </Masonry>
    </div>
  )
}
