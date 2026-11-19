import { useState } from 'react'
import { vi } from 'vitest'
import type useEmblaCarousel from 'embla-carousel-react'

type Options = Parameters<typeof useEmblaCarousel>[0]
type Listener = (api: FakeEmbla, event: string) => void

/**
 * A stand-in for the Embla API, answering what the test sets.
 *
 * jsdom lays nothing out, so the real engine measures every slide at zero and
 * never scrolls. This one reports the position the test chooses, and fires an
 * event only when the test does — which is all the carousels' wiring reads.
 */
export interface FakeEmbla {
  options: Options
  selected: number
  inView: number[]
  canPrev: boolean
  canNext: boolean
  scrollPrev: ReturnType<typeof vi.fn>
  scrollNext: ReturnType<typeof vi.fn>
  scrollTo: ReturnType<typeof vi.fn>
  selectedScrollSnap: () => number
  slidesInView: () => number[]
  canScrollPrev: () => boolean
  canScrollNext: () => boolean
  on: (event: string, listener: Listener) => FakeEmbla
  off: (event: string, listener: Listener) => FakeEmbla
  /** Fires `event` at every listener, as the engine would. */
  emit: (event: 'select' | 'slidesInView' | 'reInit') => void
  listenerCount: () => number
}

/** Every carousel mounted since the last reset, in mount order. */
export const carousels: FakeEmbla[] = []

function createFakeEmbla(options: Options): FakeEmbla {
  const listeners = new Map<string, Set<Listener>>()

  const fake: FakeEmbla = {
    options,
    selected: options?.startIndex ?? 0,
    inView: [],
    canPrev: false,
    canNext: false,
    scrollPrev: vi.fn(),
    scrollNext: vi.fn(),
    scrollTo: vi.fn(),
    selectedScrollSnap: () => fake.selected,
    slidesInView: () => fake.inView,
    canScrollPrev: () => fake.canPrev,
    canScrollNext: () => fake.canNext,
    on: (event, listener) => {
      listeners.set(event, (listeners.get(event) ?? new Set()).add(listener))

      return fake
    },
    off: (event, listener) => {
      listeners.get(event)?.delete(listener)

      return fake
    },
    emit: (event) => listeners.get(event)?.forEach((listener) => listener(fake, event)),
    listenerCount: () => [...listeners.values()].reduce((count, set) => count + set.size, 0),
  }

  return fake
}

/**
 * Replaces `embla-carousel-react`'s default export:
 *
 *     vi.mock('embla-carousel-react', async () => ({
 *       default: (await import('<path>/tests/_helpers/embla')).useFakeEmblaCarousel,
 *     }))
 */
export function useFakeEmblaCarousel(options?: Options) {
  const [api] = useState(() => {
    const fake = createFakeEmbla(options)

    carousels.push(fake)

    return fake
  })

  return [() => {}, api] as const
}
