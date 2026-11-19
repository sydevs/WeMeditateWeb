import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'

type CarouselOptions = NonNullable<Parameters<typeof useEmblaCarousel>[0]>

const EVENTS = [
  'select',
  // Fires as slides enter or leave the viewport while scrolling.
  'slidesInView',
  // Fires when the slides change, for example when items load in, so the
  // arrows and the in-view state stay right after a late data fetch.
  'reInit',
] as const

/**
 * An Embla carousel that centres one slide and scrolls one at a time, plus
 * the position state a carousel renders from.
 *
 * `options` adds what one carousel needs beyond that. Before Embla mounts,
 * `selectedIndex` is the `startIndex` and `slidesInView` is empty.
 *
 * `selectedIndex` and `scrollTo` count Embla's snaps, `slidesInView` counts
 * slides. The two agree only while every slide has a snap of its own:
 * `trimSnaps` puts every slide that fits at the start on snap 0.
 */
export function useCarousel(options: CarouselOptions = {}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    // These three are Embla's own defaults, restated to pin them: both
    // carousels read `align` and `containScroll` as part of their contract,
    // and a default is the maintainer's to change in a major.
    align: 'center',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
    ...options,
  })

  const [selectedIndex, setSelectedIndex] = useState(options.startIndex ?? 0)
  const [slidesInView, setSlidesInView] = useState<number[]>([])
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((snap: number) => emblaApi?.scrollTo(snap), [emblaApi])

  useEffect(() => {
    if (!emblaApi) return

    const update = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
      setSlidesInView(emblaApi.slidesInView())
      setCanScrollPrev(emblaApi.canScrollPrev())
      setCanScrollNext(emblaApi.canScrollNext())
    }

    // eslint-disable-next-line @eslint-react/set-state-in-effect -- the embla API exists only after mount, and the first render already draws the `startIndex` and every slide in view
    update()
    for (const event of EVENTS) emblaApi.on(event, update)

    return () => {
      for (const event of EVENTS) emblaApi.off(event, update)
    }
  }, [emblaApi])

  return {
    emblaRef,
    selectedIndex,
    slidesInView,
    canScrollPrev,
    canScrollNext,
    scrollPrev,
    scrollNext,
    scrollTo,
  }
}
