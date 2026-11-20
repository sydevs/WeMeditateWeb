import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ContentTextBox } from './ContentTextBox'

const BASE = {
  title: 'Get Connected',
  description: 'Meditation is even stronger when shared.',
  imageSrc: 'https://picsum.photos/seed/x/900/1200',
  imageAlt: 'Group class',
} as const

describe('<ContentTextBox> subtitle', () => {
  it('renders the subtitle when provided', () => {
    const html = renderToStaticMarkup(<ContentTextBox {...BASE} subtitle="Collective meditation" />)

    expect(html).toContain('Collective meditation')
  })

  it('omits the subtitle markup when not provided', () => {
    const html = renderToStaticMarkup(<ContentTextBox {...BASE} />)

    // Description still renders. Subtitle adds no extra <p>.
    expect(html).toContain('Get Connected')
    expect(html.match(/<p/g)?.length).toBe(1)
  })
})

describe('<ContentTextBox> paragraphs', () => {
  it('renders single-paragraph text as the one <p> it always has', () => {
    const html = renderToStaticMarkup(<ContentTextBox {...BASE} />)

    expect(html).toContain(
      '<p class="text-lg font-light text-gray-700">Meditation is even stronger when shared.</p>',
    )
    expect(html.match(/<p/g)?.length).toBe(1)
  })

  it('renders each paragraph of a multi-paragraph description as its own <p>', () => {
    const html = renderToStaticMarkup(
      <ContentTextBox {...BASE} description={'First paragraph.\n\nSecond paragraph.'} />,
    )

    expect(html).toContain(
      '<p class="text-lg font-light text-gray-700">First paragraph.</p>' +
        '<p class="text-lg font-light text-gray-700">Second paragraph.</p>',
    )
    expect(html.match(/<p/g)?.length).toBe(2)
  })
})

describe('<ContentTextBox> alignment', () => {
  it('defaults to the left layout (image left of the box)', () => {
    const html = renderToStaticMarkup(<ContentTextBox {...BASE} />)

    expect(html).toContain('lg:flex-row')
    expect(html).not.toContain('lg:flex-row-reverse')
  })

  it('reverses the layout when align="right"', () => {
    const html = renderToStaticMarkup(<ContentTextBox {...BASE} align="right" />)

    expect(html).toContain('lg:flex-row-reverse')
  })

  it('renders the white box treatment (no overlay glow)', () => {
    const html = renderToStaticMarkup(<ContentTextBox {...BASE} />)

    expect(html).toContain('lg:bg-white')
    expect(html).not.toContain('text-glow')
  })
})
