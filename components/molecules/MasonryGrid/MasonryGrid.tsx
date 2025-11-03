import { ComponentProps, ReactNode, useState } from 'react'
import Masonry from 'react-masonry-css'
import { Button, Link } from '../../atoms'

export interface MasonryGridItem {
  /** Unique identifier for the item */
  id: string | number
  /** Heading text (e.g., location and year) */
  heading: string
  /** Body content text */
  content: string
  /** Optional link URL - when provided, heading becomes a clickable link */
  href?: string
}

export interface MasonryGridProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Array of items to display in the masonry grid */
  items: MasonryGridItem[]
  /** Number of items to show initially (before "Show More" is clicked) */
  initialItemCount?: number
  /** Custom breakpoints for responsive columns (defaults to 1 mobile, 2 tablet, 3 desktop) */
  breakpointCols?: number | { default: number; [key: number]: number }
}

/**
 * MasonryGrid molecule displays items in a responsive masonry layout with optional "Show More" functionality.
 *
 * Based on the `.cb-grid-layout` element from wemeditate.com, this component uses CSS-based masonry
 * via react-masonry-css for optimal performance and browser compatibility.
 */
export function MasonryGrid({
  items,
  initialItemCount = 3,
  breakpointCols = {
    default: 3,  // Desktop: 3 columns (1024px+)
    1023: 2,     // Tablet: 2 columns (640px - 1023px)
    639: 1,      // Mobile: 1 column (< 640px)
  },
  className = '',
  ...props
}: MasonryGridProps) {
  const [showAll, setShowAll] = useState(false)

  // Determine which items to display
  const displayedItems = showAll ? items : items.slice(0, initialItemCount)
  const hasMoreItems = items.length > initialItemCount

  return (
    <div className={className} {...props}>
      {/* Masonry Grid */}
      <Masonry
        breakpointCols={breakpointCols}
        className="flex -ml-4 w-auto"
        columnClassName="pl-4 bg-clip-padding"
      >
        {displayedItems.map((item) => (
          <div key={item.id} className="mb-12">
            {item.href ? (
              <Link
                href={item.href}
                variant='primary'
                className="mb-4 text-xl font-medium tracking-wide block"
              >
                {item.heading}
              </Link>
            ) : (
              <h3 className="mb-4 text-xl font-medium text-gray-700 tracking-wide">
                {item.heading}
              </h3>
            )}
            <p className="text-base font-light text-gray-700 leading-relaxed">
              {item.content}
            </p>
          </div>
        ))}
      </Masonry>

      {/* Show More Button */}
      {!showAll && hasMoreItems && (
        <div className="text-center mt-8 md:mt-12">
          <Button
            variant="outline"
            onClick={() => setShowAll(true)}
            aria-label={`Show ${items.length - initialItemCount} more items`}
          >
            Show More
          </Button>
        </div>
      )}
    </div>
  )
}
