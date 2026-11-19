import { ComponentProps } from 'react'
import { ContentCard, ContentCardProps } from '../ContentCard/ContentCard'

export interface ContentGridItem extends Omit<ContentCardProps, 'className' | 'id' | 'sizes'> {
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
   * gutter`, and only the caller knows the container it put the grid in (#206).
   */
  sizes: string
  /** Card variant to apply to all cards in the grid */
  cardVariant?: 'default' | 'hero'
}

/**
 * ContentGrid molecule displays ContentCard components in a responsive masonry layout.
 *
 * Similar to MasonryGrid but composes ContentCard components instead of plain text items.
 * Always displays all cards without pagination or "Show More" functionality.
 *
 * One, two, then three columns at `sm` and `lg`, through the `masonry` utility
 * (layouts/tailwind.css): CSS only, so the server's columns are the ones a
 * phone keeps after hydration, and the cards stay in reading order.
 *
 * The outer `w-full` div takes the spread props, `ref` among them, and that is
 * a contract: ContentIndex animates that element. Moving the spread elsewhere
 * breaks the fade and its spec silently.
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
 */
export function ContentGrid({
  items,
  sizes,
  cardVariant = 'default',
  className = '',
  ...props
}: ContentGridProps) {
  // Hero cards take a gutter half as wide again: 24/30/36px against 16/20/24px.
  const gapClasses =
    cardVariant === 'hero'
      ? 'gap-x-6 sm:gap-x-[1.875rem] lg:gap-x-9'
      : 'gap-x-4 sm:gap-x-5 lg:gap-x-6'

  return (
    // `pb-8` keeps the 32px under the last row that each card's `mb-8` used to add.
    <div className={`w-full masonry gap-y-8 pb-8 ${gapClasses} ${className}`} {...props}>
      {items.map((item) => {
        const { id, sizes: itemSizes, ...cardProps } = item

        return (
          <div key={id} className="flex justify-center">
            {/* `??`, not a pre-spread default: an item built by spreading a
                wider shape can carry an explicit `sizes: undefined`, which
                a spread would hand on as the card's own (#206). */}
            <ContentCard {...cardProps} sizes={itemSizes ?? sizes} variant={cardVariant} />
          </div>
        )
      })}
    </div>
  )
}
