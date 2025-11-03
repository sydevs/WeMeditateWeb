import { useCallback, useState, useEffect } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { Column, ColumnProps } from '../Column'

export interface ColumnCarouselProps {
  /**
   * Array of column data to display (maximum 5 columns)
   */
  columns: ColumnProps[]

  /**
   * Additional CSS classes
   */
  className?: string
}

const MAX_COLUMNS = 5
const MOBILE_CAROUSEL_THRESHOLD = 3
const TABLET_CAROUSEL_THRESHOLD = 4

interface CarouselNavButtonProps {
  direction: 'prev' | 'next'
  column: ColumnProps | null
  onClick: () => void
  disabled: boolean
}

/**
 * Navigation button for carousel - displays chevron and adjacent column title
 */
function CarouselNavButton({ direction, column, onClick, disabled }: CarouselNavButtonProps) {
  const isPrev = direction === 'prev'
  const ariaLabel = column ? `${isPrev ? 'Previous' : 'Next'}: ${column.title}` : direction === 'prev' ? 'Previous' : 'Next'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-teal-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-w-0"
    >
      {column && (
        <>
          {isPrev && <ChevronLeftIcon className="w-5 h-5 shrink-0" />}
          <span className="max-w-[100px] truncate">{column.title}</span>
          {!isPrev && <ChevronRightIcon className="w-5 h-5 shrink-0" />}
        </>
      )}
    </button>
  )
}

/**
 * ColumnCarousel molecule - displays columns in a responsive layout.
 *
 * Responsive behavior based on column count:
 * - Mobile (< 768px): Carousel for 3+ columns, stacked for 1-2 columns
 * - Tablet (768px-1024px): Carousel for 4+ columns, flex row for 1-3 columns
 * - Desktop (≥ 1024px): Flex row for all column counts
 *
 * Carousel features:
 * - Navigation buttons showing adjacent column titles
 * - Dot indicators showing position
 * - Starts focused on center column
 * - Swipe gestures supported
 *
 * Maximum 5 columns allowed. Additional columns will be truncated with a warning.
 *
 * @example
 * <ColumnCarousel
 *   columns={[
 *     { title: "Left Aspect", description: "...", imageUrl: "/left.jpg" },
 *     { title: "Central Aspect", description: "...", imageUrl: "/center.jpg" },
 *     { title: "Right Aspect", description: "...", imageUrl: "/right.jpg" }
 *   ]}
 * />
 */
export function ColumnCarousel({
  columns: rawColumns,
  className = '',
}: ColumnCarouselProps) {
  // Enforce maximum of 5 columns
  const columns = rawColumns.slice(0, MAX_COLUMNS)

  // Initialize to center column
  const centerIndex = Math.floor(columns.length / 2)

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
    startIndex: centerIndex,
  })

  const [selectedIndex, setSelectedIndex] = useState(centerIndex)

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index)
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  // Warn if columns were truncated (only log once when count changes)
  useEffect(() => {
    if (rawColumns.length > MAX_COLUMNS) {
      console.warn(
        `ColumnCarousel: Maximum ${MAX_COLUMNS} columns allowed. Received ${rawColumns.length} columns. Truncating to ${MAX_COLUMNS}.`
      )
    }
  }, [rawColumns.length])

  const hasPrev = selectedIndex > 0
  const hasNext = selectedIndex < columns.length - 1
  const prevColumn = hasPrev ? columns[selectedIndex - 1] : null
  const nextColumn = hasNext ? columns[selectedIndex + 1] : null

  // Carousel usage based on column count and breakpoint
  const useCarouselMobile = columns.length >= MOBILE_CAROUSEL_THRESHOLD
  const useCarouselTablet = columns.length >= TABLET_CAROUSEL_THRESHOLD

  // Show carousel on mobile (3+ cols) or tablet (4+ cols)
  const showCarousel = useCarouselMobile || useCarouselTablet

  return (
    <div className={className}>
      {/* Consolidated Carousel (Mobile: 3+ cols, Tablet: 4+ cols) */}
      {showCarousel && (
        <div
          className={`
            ${useCarouselMobile ? '' : 'md:hidden'}
            ${useCarouselTablet ? 'md:block' : ''}
            lg:hidden
          `}
        >
          {/* Navigation controls above carousel */}
          <div className="flex items-center mb-6">
            <div className="flex-1 min-w-0">
              <CarouselNavButton
                direction="prev"
                column={prevColumn}
                onClick={scrollPrev}
                disabled={!hasPrev}
              />
            </div>

            {/* Dot indicators - absolutely centered */}
            <div className="flex gap-2 shrink-0 px-4">
              {columns.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollTo(index)}
                  aria-label={`Go to column ${index + 1}: ${columns[index].title}`}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === selectedIndex
                      ? 'bg-teal-600'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            <div className="flex-1 min-w-0 flex justify-end">
              <CarouselNavButton
                direction="next"
                column={nextColumn}
                onClick={scrollNext}
                disabled={!hasNext}
              />
            </div>
          </div>

          {/* Carousel viewport */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {columns.map((column, index) => (
                <div
                  key={index}
                  className="flex-[0_0_auto] w-full flex justify-center"
                >
                  <Column {...column} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Consolidated Non-Carousel Layout */}
      {/* Mobile: stacked (1-2 cols) or hidden (3+ cols use carousel) */}
      {/* Tablet: hidden (4+ cols use carousel) or flex row (1-3 cols) */}
      {/* Desktop: always flex row */}
      <div
        className={`
          ${!useCarouselMobile ? 'flex flex-col md:flex-row' : 'hidden'}
          ${useCarouselTablet ? 'md:hidden!' : ''}
          lg:flex! lg:flex-row
          items-start justify-center gap-8
        `}
      >
        {columns.map((column, index) => (
          <Column key={index} {...column} />
        ))}
      </div>
    </div>
  )
}
