/**
 * Pins the hit-area class contract the dots and the nav buttons depend on
 * (#135). A box needs a browser, so the measuring stays in Ladle.
 */

import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ColumnCarousel } from './ColumnCarousel'

const columns = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    title: `Column ${index + 1}`,
    description: `Description ${index + 1}`,
  }))

// The dots render from MOBILE_CAROUSEL_THRESHOLD up to MAX_COLUMNS.
const COUNTS = [3, 4, 5] as const

describe('ColumnCarousel slide dots', () => {
  it.each(COUNTS)('draws %i 8px dots, each in its own 40px cell', (count) => {
    const html = renderToStaticMarkup(<ColumnCarousel columns={columns(count)} />)

    expect(
      html.match(
        /class="group flex w-10 h-10 items-center justify-center"><span class="w-2 h-2 rounded-full/g,
      ),
    ).toHaveLength(count)
  })

  it('abuts the cells, and leaves no overlay to steal a neighbour', () => {
    const html = renderToStaticMarkup(<ColumnCarousel columns={columns(5)} />)

    expect(html).not.toContain('touch-target-overlay')
    // An inter-cell gap is what pushed 5 cells past the viewport at 44px.
    expect(html).toContain('flex gap-0 shrink-0 px-4')
  })

  it('labels each dot with the slide it scrolls to, in order', () => {
    const html = renderToStaticMarkup(<ColumnCarousel columns={columns(5)} />)

    const labels = [...html.matchAll(/aria-label="Go to column (\d+): ([^"]+)"/g)].map(
      ([, number, title]) => `${number}:${title}`,
    )

    expect(labels).toEqual([
      '1:Column 1',
      '2:Column 2',
      '3:Column 3',
      '4:Column 4',
      '5:Column 5',
    ])
  })
})

describe('CarouselNavButton', () => {
  // The dots are 40px because these two keep `touch-target`'s 44px floor.
  it('keeps its own 44px floor', () => {
    const html = renderToStaticMarkup(<ColumnCarousel columns={columns(5)} />)

    expect(html.match(/flex touch-target items-center/g)).toHaveLength(2)
  })

  // That floor shrinks a flex item only. The prev slot was the one without
  // `flex`, so its block-level `<button>` kept its full text width and
  // reached 69px into the dots (#135).
  it('gives both buttons a flex slot, so the floor can bite', () => {
    const html = renderToStaticMarkup(<ColumnCarousel columns={columns(5)} />)

    expect(html.match(/min-w-0 flex/g)).toHaveLength(2)
  })

  it('lets the title truncate instead of flooring the button at its text width', () => {
    const html = renderToStaticMarkup(<ColumnCarousel columns={columns(5)} />)

    expect(html).toContain('min-w-0 truncate')
  })
})
