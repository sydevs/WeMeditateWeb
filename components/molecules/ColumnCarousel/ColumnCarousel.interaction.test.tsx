// @vitest-environment jsdom
/**
 * What the carousel does with Embla once it mounts. The markup contract is
 * in `ColumnCarousel.test.tsx`; this file needs a DOM for the effects.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { ColumnCarousel } from './ColumnCarousel'
import { carousels, type FakeEmbla } from '../../../tests/_helpers/embla'

vi.mock('embla-carousel-react', async () => ({
  default: (await import('../../../tests/_helpers/embla')).useFakeEmblaCarousel,
}))

const columns = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    title: `Column ${index + 1}`,
    description: `Description ${index + 1}`,
  }))

const embla = (): FakeEmbla => {
  const api = carousels.at(-1)

  if (!api) throw new Error('no carousel mounted')

  return api
}

const pressedDots = () =>
  screen
    .getAllByRole('button', { name: /^Go to column/ })
    .filter((dot) => dot.getAttribute('aria-pressed') === 'true')
    .map((dot) => dot.getAttribute('aria-label'))

const navButton = (direction: 'Previous' | 'Next') =>
  screen.getByRole('button', { name: new RegExp(`^${direction}`) })

beforeEach(() => {
  carousels.length = 0
})

describe('<ColumnCarousel> with Embla mounted', () => {
  it.each([
    [3, 1],
    [4, 2],
    [5, 2],
  ])('starts %i columns on the centre one', (count, startIndex) => {
    render(<ColumnCarousel columns={columns(count)} />)

    expect(embla().options?.startIndex).toBe(startIndex)
    expect(pressedDots()).toEqual([`Go to column ${startIndex + 1}: Column ${startIndex + 1}`])
  })

  it('moves the pressed dot and both nav titles to the slide Embla selects', () => {
    render(<ColumnCarousel columns={columns(5)} />)

    act(() => {
      embla().selected = 3
      embla().emit('select')
    })

    expect(pressedDots()).toEqual(['Go to column 4: Column 4'])
    expect(navButton('Previous').getAttribute('aria-label')).toBe('Previous: Column 3')
    expect(navButton('Next').getAttribute('aria-label')).toBe('Next: Column 5')
  })

  it('disables the nav button at its end of the row, and drops the title', () => {
    render(<ColumnCarousel columns={columns(5)} />)

    act(() => {
      embla().selected = 4
      embla().emit('select')
    })

    expect(navButton('Next')).toHaveProperty('disabled', true)
    expect(navButton('Next').getAttribute('aria-label')).toBe('Next')
    expect(navButton('Previous')).toHaveProperty('disabled', false)

    act(() => {
      embla().selected = 0
      embla().emit('select')
    })

    expect(navButton('Previous')).toHaveProperty('disabled', true)
    expect(navButton('Previous').getAttribute('aria-label')).toBe('Previous')
  })

  it('asks Embla to scroll when a control is pressed', () => {
    render(<ColumnCarousel columns={columns(5)} />)

    fireEvent.click(navButton('Next'))
    fireEvent.click(navButton('Previous'))
    fireEvent.click(screen.getByRole('button', { name: 'Go to column 1: Column 1' }))

    expect(embla().scrollNext).toHaveBeenCalledOnce()
    expect(embla().scrollPrev).toHaveBeenCalledOnce()
    expect(embla().scrollTo).toHaveBeenCalledExactlyOnceWith(0)
  })

  it('stops listening to Embla when it unmounts', () => {
    const { unmount } = render(<ColumnCarousel columns={columns(5)} />)

    expect(embla().listenerCount()).toBeGreaterThan(0)

    unmount()

    expect(embla().listenerCount()).toBe(0)
  })
})
