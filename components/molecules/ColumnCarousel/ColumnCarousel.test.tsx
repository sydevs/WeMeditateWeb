/**
 * Pins the hit-area contract the dots and the nav buttons depend on (#135).
 * A box needs a browser, so the measuring stays in Ladle.
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

const dotButtons = (html: string) =>
  [...html.matchAll(/<button[^>]*>/g)]
    .map(([tag]) => tag)
    .filter((tag) => tag.includes('aria-label="Go to column'))

describe('ColumnCarousel slide dots', () => {
  it.each(COUNTS)('draws %i 8px dots, each in its own 40px cell', (count) => {
    const html = renderToStaticMarkup(<ColumnCarousel columns={columns(count)} />)
    const dots = dotButtons(html)

    expect(dots).toHaveLength(count)
    for (const dot of dots) {
      expect(dot).toContain('w-10')
      expect(dot).toContain('h-10')
    }
    expect(html.match(/<span class="[^"]*w-2 h-2 rounded-full/g)).toHaveLength(count)
  })

  it('leaves no overlay to steal a neighbour', () => {
    const html = renderToStaticMarkup(<ColumnCarousel columns={columns(5)} />)

    expect(html).not.toContain('touch-target-overlay')
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

  it('presses exactly the dot whose slide is showing', () => {
    const html = renderToStaticMarkup(<ColumnCarousel columns={columns(5)} />)
    const dots = dotButtons(html)

    expect(dots.filter((dot) => dot.includes('aria-pressed="true"'))).toHaveLength(1)
    expect(dots.filter((dot) => dot.includes('aria-pressed="false"'))).toHaveLength(4)
  })

  it('draws the focus ring on each dot', () => {
    const html = renderToStaticMarkup(<ColumnCarousel columns={columns(5)} />)
    const dots = dotButtons(html)

    expect(dots.filter((dot) => dot.includes('focus-ring'))).toHaveLength(5)
  })
})

describe('CarouselNavButton', () => {
  const html = () => renderToStaticMarkup(<ColumnCarousel columns={columns(5)} />)

  // Each nav button, open tag to close, so a child's position can be read.
  const navButton = (markup: string, label: string) => {
    const at = markup.indexOf(`aria-label="${label}`)
    return markup.slice(markup.lastIndexOf('<button', at), markup.indexOf('</button>', at))
  }

  // The dots are 40px because these two keep `touch-target`'s 44px floor, and
  // `xs` is the one Button size whose padding fits inside it.
  it('keeps its own 44px floor, and takes no overlay beside it', () => {
    for (const label of ['Previous:', 'Next:']) {
      const nav = navButton(html(), label)

      expect(nav).toContain('touch-target')
      expect(nav).not.toContain('touch-target-overlay')
      expect(nav).toContain('px-3')
    }
  })

  // That floor shrinks a flex item only. The prev slot was the one without
  // `flex`, so its block-level `<button>` kept its full text width and
  // reached 69px into the dots (#135).
  it('gives both buttons a flex slot, so the floor can bite', () => {
    expect(html().match(/min-w-0 flex/g)).toHaveLength(2)
  })

  it('lets the title truncate instead of flooring the button at its text width', () => {
    expect(html().match(/min-w-0 truncate/g)).toHaveLength(2)
  })

  it('draws the focus ring', () => {
    for (const label of ['Previous:', 'Next:']) {
      expect(navButton(html(), label)).toContain('focus-ring')
    }
  })

  // Button drops an `aria-label` on its icon-only form alone. These are text
  // buttons, and the visible title says nothing about which way it goes.
  it('names the direction, though the visible label is only the title', () => {
    const markup = html()

    expect(markup).toContain('aria-label="Previous: Column 2"')
    expect(markup).toContain('aria-label="Next: Column 4"')
  })

  it('leads the chevron on prev and trails it on next', () => {
    const markup = html()
    const prev = navButton(markup, 'Previous:')
    const next = navButton(markup, 'Next:')

    expect(prev.indexOf('<svg')).toBeLessThan(prev.indexOf('min-w-0 truncate'))
    expect(next.indexOf('<svg')).toBeGreaterThan(next.indexOf('min-w-0 truncate'))
  })
})
