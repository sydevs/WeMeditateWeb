import { ComponentProps, useCallback, useState, useEffect } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid'
import { ContentCard, ContentCardProps } from '../../ContentCard/ContentCard'
import { Button } from '../../../atoms/Button/Button'

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
   * Custom class name for the carousel container
   */
  className?: string
}

/**
 * ContentCarousel block - displays a horizontal scrolling carousel of hero-variant ContentCards.
 *
 * Uses Embla Carousel for lightweight, performant carousel functionality with
 * arrow navigation buttons using the Button component.
 *
 * @example
 * <ContentCarousel
 *   title="Featured Meditations"
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
  className = '',
  ...props
}: ContentCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
  })

  const [selectedIndex, setSelectedIndex] = useState(0)

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

  return (
    <div className={`relative ${className}`} {...props}>
      {/* Optional title */}
      {title && (
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          {title}
        </h2>
      )}

      {/* Navigation buttons */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none z-10">
        <Button
          icon={ChevronLeftIcon}
          variant="primary"
          size="md"
          shape="square"
          onClick={scrollPrev}
          aria-label="Previous slide"
          className="pointer-events-auto -translate-x-1/2 shadow-lg hover:shadow-xl transition-shadow"
        />
        <Button
          icon={ChevronRightIcon}
          variant="primary"
          size="md"
          shape="square"
          onClick={scrollNext}
          aria-label="Next slide"
          className="pointer-events-auto translate-x-1/2 shadow-lg hover:shadow-xl transition-shadow"
        />
      </div>

      {/* Carousel viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 sm:gap-6">
          {items.map((item, index) => {
            const isFocused = index === selectedIndex
            return (
              <div
                key={index}
                onClick={() => scrollTo(index)}
                className={`flex-[0_0_auto] transition-opacity duration-300 ${
                  isFocused ? 'opacity-100 cursor-default' : 'opacity-40 cursor-pointer'
                }`}
              >
                <div className={isFocused ? '' : 'pointer-events-none'}>
                  <ContentCard
                    {...item}
                    variant="hero"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
