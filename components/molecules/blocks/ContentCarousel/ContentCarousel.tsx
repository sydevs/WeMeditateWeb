import { ComponentProps, useCallback, useState, useEffect } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid'
import { ContentCard, ContentCardProps } from '../../ContentCard/ContentCard'
import { Button } from '../../../atoms/Button/Button'

/** Carousel size variant. */
export type ContentCarouselSize = 'sm' | 'md' | 'lg'

/**
 * Coordinated dimensions per size: the image height, the ContentCard variant
 * (which scales the title, gap, and play button together), and the gap between
 * slides. Keeping these in one place is what lets `size` resize the whole card
 * proportionally instead of just the image.
 */
const CAROUSEL_SIZES: Record<
  ContentCarouselSize,
  { imageHeight: string; card: 'default' | 'hero'; slideGap: string }
> = {
  sm: { imageHeight: 'h-40 sm:h-44 lg:h-48', card: 'default', slideGap: 'gap-3 sm:gap-4' },
  md: { imageHeight: 'h-48 sm:h-56 lg:h-64', card: 'hero', slideGap: 'gap-4 sm:gap-6' },
  lg: { imageHeight: 'h-56 sm:h-64 lg:h-72', card: 'hero', slideGap: 'gap-4 sm:gap-6' },
}

export interface ContentCarouselProps extends Omit<ComponentProps<'div'>, 'title'> {
  /**
   * Array of content items to display in the carousel
   */
  items: Omit<ContentCardProps, 'variant'>[]

  /**
   * Optional heading for the carousel section
   */
  title?: string

  /**
   * Size variant — resizes the whole card (image height, title, gap, play
   * button) in a coordinated way, and positions the nav arrows on the image.
   * - `sm`: compact (smaller image + default card title)
   * - `md`: medium image, hero card title
   * - `lg`: large image, hero card title
   * @default 'lg'
   */
  size?: ContentCarouselSize

  /**
   * Custom class name for the carousel container
   */
  className?: string
}

/**
 * ContentCarousel block - a horizontal scrolling carousel of ContentCards.
 *
 * Uses Embla Carousel for lightweight, performant carousel functionality with
 * arrow navigation buttons using the Button component. Each card renders its
 * image at a fixed height (natural width) so the row shares a consistent image
 * height while each image keeps its own aspect ratio; `size` picks that height
 * plus the matching card title/spacing.
 *
 * @example
 * <ContentCarousel
 *   title="Featured Meditations"
 *   size="sm"
 *   items={[
 *     {
 *       title: "Inner Peace",
 *       href: "/meditations/peace",
 *       thumbnailSrc: "/images/peace.jpg",
 *       playButton: true,
 *       durationMinutes: 15
 *     },
 *     // ... more items
 *   ]}
 * />
 */
export function ContentCarousel({
  items,
  title,
  size = 'lg',
  className = '',
  ...props
}: ContentCarouselProps) {
  const { imageHeight, card, slideGap } = CAROUSEL_SIZES[size]

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
    // A slide counts as "in view" (full opacity + interactive) once ~3/4
    // visible. Basing focus on actual visibility — not a single centered index
    // — means every fully-visible card stays bright and only edge-clipped
    // peekers fade, however many slides fit at the current size/viewport.
    inViewThreshold: 0.95,
  })

  const [slidesInView, setSlidesInView] = useState<number[]>([])
  // Whether the carousel can scroll further in each direction; drives hiding the
  // prev/next arrows at the first/last slide.
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const updateState = useCallback(() => {
    if (!emblaApi) return
    setSlidesInView(emblaApi.slidesInView())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index)
    },
    [emblaApi],
  )

  useEffect(() => {
    if (!emblaApi) return
    updateState()
    emblaApi.on('select', updateState)
    // slidesInView fires as slides enter/leave the viewport while scrolling.
    emblaApi.on('slidesInView', updateState)
    // reInit fires when the slides change (e.g. items load in), so arrow
    // visibility + in-view state stay correct after a late data fetch.
    emblaApi.on('reInit', updateState)

    return () => {
      emblaApi.off('select', updateState)
      emblaApi.off('slidesInView', updateState)
      emblaApi.off('reInit', updateState)
    }
  }, [emblaApi, updateState])

  return (
    <div className={`relative ${className}`} {...props}>
      {/* Optional title */}
      {title && <h2 className="text-2xl font-semibold text-gray-900 mb-6">{title}</h2>}

      {/* Slides area — its own positioning context so the nav arrows overlay the
          image row (not the whole section). */}
      <div className="relative">
        {/* Navigation buttons. The overlay box is exactly the image height and
            top-aligned with the slides, so `items-center` keeps the arrows
            centered on the image even when a title wraps to two lines. Each
            arrow hides at its end of the carousel. */}
        <div
          className={`absolute top-0 left-0 right-0 ${imageHeight} flex items-center justify-between pointer-events-none z-10`}
        >
          <Button
            aria-hidden={!canScrollPrev}
            aria-label="Previous slide"
            className={`-translate-x-1/2 shadow-lg hover:shadow-xl transition duration-200 ${
              canScrollPrev ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
            icon={ChevronLeftIcon}
            shape="square"
            size="md"
            tabIndex={canScrollPrev ? undefined : -1}
            variant="primary"
            onClick={scrollPrev}
          />
          <Button
            aria-hidden={!canScrollNext}
            aria-label="Next slide"
            className={`translate-x-1/2 shadow-lg hover:shadow-xl transition duration-200 ${
              canScrollNext ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
            icon={ChevronRightIcon}
            shape="square"
            size="md"
            tabIndex={canScrollNext ? undefined : -1}
            variant="primary"
            onClick={scrollNext}
          />
        </div>

        {/* Carousel viewport */}
        <div ref={emblaRef} className="overflow-hidden">
          <div className={`flex ${slideGap}`}>
            {items.map((item, index) => {
              // Before Embla measures (SSR + first paint) slidesInView is empty;
              // treat that as "all visible" so the row renders bright rather than
              // fully dimmed until the fade kicks in on mount.
              const inView = slidesInView.length === 0 || slidesInView.includes(index)

              return (
                <div
                  key={index}
                  className={`flex-[0_0_auto] transition-opacity duration-300 ${
                    inView ? 'opacity-100 cursor-default' : 'opacity-40 cursor-pointer'
                  }`}
                  // A clipped/edge slide scrolls into view on click; a fully
                  // visible one keeps its own links/play button clickable.
                  onClick={inView ? undefined : () => scrollTo(index)}
                >
                  <div className={inView ? '' : 'pointer-events-none'}>
                    {/* Fixed image height (natural width) → consistent row height
                        without forcing a single aspect ratio. */}
                    <ContentCard {...item} imageHeight={imageHeight} variant={card} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
