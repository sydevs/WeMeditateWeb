// @vitest-environment jsdom
/**
 * What the carousel does with Embla once it mounts. The slide sizes are in
 * `ContentCarousel.test.tsx`; this file needs a DOM for the effects.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { ContentCarousel } from './ContentCarousel'
import { carousels, type FakeEmbla } from '../../../../tests/_helpers/embla'
import { CF_PUBLIC_URL } from '../../../../tests/_helpers/cloudflare-images'

vi.mock('embla-carousel-react', async () => ({
  default: (await import('../../../../tests/_helpers/embla')).useFakeEmblaCarousel,
}))

const items = ['One', 'Two', 'Three', 'Four'].map((title) => ({
  title,
  href: `/m/${title.toLowerCase()}`,
  thumbnailSrc: CF_PUBLIC_URL,
}))

const embla = (): FakeEmbla => {
  const api = carousels.at(-1)

  if (!api) throw new Error('no carousel mounted')

  return api
}

const report = (
  event: 'select' | 'slidesInView' | 'reInit',
  state: Partial<Pick<FakeEmbla, 'inView' | 'canPrev' | 'canNext'>>,
) =>
  act(() => {
    Object.assign(embla(), state)
    embla().emit(event)
  })

// By label, not role: a withdrawn arrow is `aria-hidden`, so it has no
// accessible name for a role query to match.
const arrow = (label: 'Previous slide' | 'Next slide') =>
  screen.getByLabelText(label, { selector: 'button' })

const isWithdrawn = (button: HTMLElement) =>
  button.getAttribute('aria-hidden') === 'true' && button.getAttribute('tabindex') === '-1'

// The slide box around a card, which carries the fade and the click.
const slide = (title: string) => {
  let node: HTMLElement | null = screen.getByText(title)

  while (node && !node.classList.contains('flex-[0_0_auto]')) node = node.parentElement
  if (!node) throw new Error(`no slide for ${title}`)

  return node
}

const isDimmed = (title: string) => slide(title).classList.contains('opacity-40')

beforeEach(() => {
  carousels.length = 0
})

describe('<ContentCarousel> with Embla mounted', () => {
  it('withdraws both arrows while Embla can scroll neither way', () => {
    render(<ContentCarousel items={items} />)

    expect(isWithdrawn(arrow('Previous slide'))).toBe(true)
    expect(isWithdrawn(arrow('Next slide'))).toBe(true)
  })

  it('offers each arrow once Embla can scroll that way', () => {
    render(<ContentCarousel items={items} />)

    report('select', { canNext: true })

    expect(isWithdrawn(arrow('Previous slide'))).toBe(true)
    expect(isWithdrawn(arrow('Next slide'))).toBe(false)

    report('select', { canPrev: true, canNext: false })

    expect(isWithdrawn(arrow('Previous slide'))).toBe(false)
    expect(isWithdrawn(arrow('Next slide'))).toBe(true)
  })

  // Items that load after mount reach Embla as a reInit, with no select.
  it('re-reads the arrows when the slides change', () => {
    render(<ContentCarousel items={items} />)

    report('reInit', { canPrev: true, canNext: true })

    expect(isWithdrawn(arrow('Previous slide'))).toBe(false)
    expect(isWithdrawn(arrow('Next slide'))).toBe(false)
  })

  it('renders every slide bright until Embla reports what is in view', () => {
    render(<ContentCarousel items={items} />)

    expect(items.filter(({ title }) => isDimmed(title))).toEqual([])
  })

  it('dims the slides Embla reports out of view, as they scroll', () => {
    render(<ContentCarousel items={items} />)

    report('slidesInView', { inView: [0, 1] })

    expect(items.map(({ title }) => isDimmed(title))).toEqual([false, false, true, true])

    report('slidesInView', { inView: [2, 3] })

    expect(items.map(({ title }) => isDimmed(title))).toEqual([true, true, false, false])
  })

  it('scrolls a dimmed slide into view on click, and leaves a bright one alone', () => {
    render(<ContentCarousel items={items} />)

    report('slidesInView', { inView: [0, 1] })
    fireEvent.click(slide('Two'))
    fireEvent.click(slide('Three'))

    // The stand-in gives every slide its own snap, so slide 2 is snap 2. A real
    // wide viewport can merge the leading slides onto snap 0, and then it is not.
    expect(embla().scrollTo).toHaveBeenCalledExactlyOnceWith(2)
  })

  it('asks Embla to scroll when an arrow is pressed', () => {
    render(<ContentCarousel items={items} />)

    report('select', { canPrev: true, canNext: true })
    fireEvent.click(arrow('Next slide'))
    fireEvent.click(arrow('Previous slide'))

    expect(embla().scrollNext).toHaveBeenCalledOnce()
    expect(embla().scrollPrev).toHaveBeenCalledOnce()
  })

  it('stops listening to Embla when it unmounts', () => {
    const { unmount } = render(<ContentCarousel items={items} />)

    expect(embla().listenerCount()).toBeGreaterThan(0)

    unmount()

    expect(embla().listenerCount()).toBe(0)
  })
})
