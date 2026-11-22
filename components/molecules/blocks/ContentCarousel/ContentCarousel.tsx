import { ComponentProps } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid'
import { ContentCard, ContentCardProps } from '@/components/molecules/ContentCard/ContentCard'
import { Button } from '@/components/atoms/Button/Button'
import { useCarousel } from '@/hooks/useCarousel'
import { useT } from '@/hooks/useT'
import { ASPECT_RATIO_VALUES, type AspectRatio } from '@/lib/media/cloudflare-images'

/** Carousel size variant. */
export type ContentCarouselSize = 'sm' | 'md' | 'lg'

/** Pixels per Tailwind spacing unit: `--spacing` is 0.25rem at a 16px root. */
const SPACING_PX = 4

/**
 * A row height, as the three `h-*` classes that draw it.
 *
 * The shape is a type rather than a runtime check, so `slideSizes` has no
 * unreachable error branch to leave untested.
 */
type TrackHeight = `h-${number} sm:h-${number} lg:h-${number}`

/**
 * Coordinated dimensions per size: the image height, the ContentCard variant
 * (which scales the title, gap, and play button together), and the gap between
 * slides. Keeping these in one place is what lets `size` resize the whole card
 * proportionally instead of just the image.
 */
const CAROUSEL_SIZES: Record<
  ContentCarouselSize,
  { imageHeight: TrackHeight; card: 'default' | 'hero'; slideGap: string }
> = {
  sm: { imageHeight: 'h-40 sm:h-44 lg:h-48', card: 'default', slideGap: 'gap-3 sm:gap-4' },
  md: { imageHeight: 'h-48 sm:h-56 lg:h-64', card: 'hero', slideGap: 'gap-4 sm:gap-6' },
  lg: { imageHeight: 'h-56 sm:h-64 lg:h-72', card: 'hero', slideGap: 'gap-4 sm:gap-6' },
}

/**
 * The `sizes` for one slide of a row `imageHeight` tall.
 *
 * A slide is `h-NN w-auto`, so it renders `height × ratio` wide — which makes
 * the width a property of the *item*, not of the row. One flat length per row
 * cannot express that: the 16:9 figure over-declares a square card by 1.78x,
 * enough to cross a srcset rung and fetch four times the pixels (#146).
 *
 * The heights are read out of the class string rather than restated beside it.
 * Tailwind compiles only a candidate it finds verbatim in a scanned file, so
 * the string has to stay literal, and a second copy of the numbers would be
 * the same defect as a `sizes` outliving its box.
 */
function slideSizes(imageHeight: TrackHeight, aspectRatio: AspectRatio = 'square'): string {
  const ratio = ASPECT_RATIO_VALUES[aspectRatio]
  const [base, sm, lg] = imageHeight
    .split(' ')
    .map((candidate) => Math.ceil(Number(candidate.replace(/\D/g, '')) * SPACING_PX * ratio))

  return `(min-width: 1024px) ${lg}px, (min-width: 640px) ${sm}px, ${base}px`
}

export interface ContentCarouselProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** Array of content items to display in the carousel */
  items: (Omit<ContentCardProps, 'variant' | 'sizes'> & {
    /** Overrides the length this carousel derives for the slide. */
    sizes?: string
  })[]

  /** Optional heading for the carousel section */
  title?: string

  /**
   * Size variant — resizes the whole card (image height, title, gap, play
   * button) in a coordinated way, and positions the nav arrows on the image.
   * - `sm`: compact (smaller image and default card title)
   * - `md`: medium image, hero card title
   * - `lg`: large image, hero card title
   * @default 'lg'
   */
  size?: ContentCarouselSize

  /** Custom class name for the carousel container */
  className?: string
}

/**
 * ContentCarousel is a horizontal scrolling carousel of ContentCards.
 *
 * It uses Embla Carousel for a lightweight, performant carousel, with arrow
 * navigation buttons built from the Button component. Each card renders its
 * image at a fixed height and natural width, so the row shares a consistent
 * image height while each image keeps its own aspect ratio. `size` picks
 * that height, plus the matching card title and spacing.
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
  const t = useT()
  const { imageHeight, card, slideGap } = CAROUSEL_SIZES[size]

  const { emblaRef, slidesInView, canScrollPrev, canScrollNext, scrollPrev, scrollNext, scrollTo } =
    useCarousel({
      // A slide counts as "in view", full opacity and interactive, once it is
      // nearly fully visible (~0.95). This bases focus on actual visibility,
      // not a single centered index, so every fully-visible card stays bright
      // and only edge-clipped peekers fade, however many slides fit in the
      // current viewport.
      inViewThreshold: 0.95,
    })

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
            aria-label={t('blocks.a11y.previous_slide')}
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
            aria-label={t('blocks.a11y.next_slide')}
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
              // Before Embla measures, during SSR and the first paint,
              // slidesInView is empty. Treat that as "all visible", so the
              // row renders bright instead of fully dimmed until the fade starts on mount.
              const inView = slidesInView.length === 0 || slidesInView.includes(index)

              return (
                <div
                  // eslint-disable-next-line @eslint-react/no-array-index-key -- a slide over the `items` prop, in the order the block declares; the carousel scrolls it but never reorders it
                  key={index}
                  className={`flex-[0_0_auto] transition-opacity duration-300 ${
                    inView ? 'opacity-100 cursor-default' : 'opacity-40 cursor-pointer'
                  }`}
                  // A clipped or edge slide scrolls into view on click. A
                  // fully visible slide keeps its own links and play button clickable.
                  // shortcut: passes the slide index as a snap index, which overshoots once a wide
                  // viewport puts several leading slides on snap 0; map it through
                  // `internalEngine().slideRegistry` when a clicked slide is seen staying dimmed.
                  onClick={inView ? undefined : () => scrollTo(index)}
                >
                  <div className={inView ? '' : 'pointer-events-none'}>
                    {/* Fixed image height (natural width) → consistent row height
                        without forcing a single aspect ratio. */}
                    <ContentCard
                      {...item}
                      imageHeight={imageHeight}
                      sizes={item.sizes ?? slideSizes(imageHeight, item.aspectRatio)}
                      variant={card}
                    />
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
