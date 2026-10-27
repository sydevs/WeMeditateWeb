/**
 * The slide dots' hit areas.
 *
 * Each dot carried a 44×44 `touch-target-overlay` on 16px centres, so a dot's
 * invisible box started 6px left of its neighbour's visible circle and, as the
 * later sibling, won the shared strip: tapping the dot you could see selected
 * the *next* slide (#135). The fix is geometric — abutting 40px cells cannot
 * overlap — so what is worth pinning is the class contract that makes it true.
 * A box needs a browser to measure, so that part stays in Ladle and on the
 * preview.
 */

import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ColumnCarousel } from './ColumnCarousel'

// `ColumnProps` needs only `title` and `description`; the rest are optional.
const columns = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    title: `Column ${index + 1}`,
    description: `Description ${index + 1}`,
  }))

// The dots render from MOBILE_CAROUSEL_THRESHOLD up to MAX_COLUMNS.
const COUNTS = [3, 4, 5] as const

describe('ColumnCarousel slide dots', () => {
  it.each(COUNTS)('gives each of %i dots its own 40px cell', (count) => {
    const html = renderToStaticMarkup(<ColumnCarousel columns={columns(count)} />)

    expect(html.match(/w-10 h-10/g)).toHaveLength(count)
  })

  it.each(COUNTS)('leaves no overlay to steal a neighbour at %i columns', (count) => {
    const html = renderToStaticMarkup(<ColumnCarousel columns={columns(count)} />)

    expect(html).not.toContain('touch-target-overlay')
    // An inter-cell gap is what pushed 5 cells past the viewport at 44px.
    expect(html).toContain('flex gap-0 shrink-0 px-4')
  })

  it('draws the dot 8px inside its cell, not as the cell', () => {
    const html = renderToStaticMarkup(<ColumnCarousel columns={columns(5)} />)

    expect(html).toMatch(
      /<button[^>]*class="group flex w-10 h-10 items-center justify-center"[^>]*><span class="w-2 h-2 rounded-full/,
    )
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

  // `touch-target`'s `min-width` only shrinks a *flex item*. The prev wrapper
  // was the one `display: block`, which sizes its `<button>` fit-content with
  // the min-content width as a floor — so the button stayed 132px inside a
  // 63px wrapper and reached 69px into the dots (#135).
  it('makes a flex item of both buttons, so the floor can bite', () => {
    const html = renderToStaticMarkup(<ColumnCarousel columns={columns(5)} />)

    expect(html.match(/class="flex-1 min-w-0 flex(?: justify-end)?"/g)).toHaveLength(2)
  })

  it('lets the title truncate instead of flooring the button at its text width', () => {
    const html = renderToStaticMarkup(<ColumnCarousel columns={columns(5)} />)

    expect(html).toContain('class="max-w-[100px] min-w-0 truncate"')
  })
})
