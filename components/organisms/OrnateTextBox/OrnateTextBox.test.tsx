import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { OrnateTextBox } from './OrnateTextBox'

const BASE = {
  title: 'Sacred Teachings',
  description: 'In every culture one can find tales of timeless wisdom.',
  imageSrc: 'https://picsum.photos/seed/x/900/1200',
  imageAlt: 'Artwork',
} as const

describe('<OrnateTextBox>', () => {
  it('renders the warm parchment surface and a botanical ornament', () => {
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} />)

    expect(html).toContain('bg-warm')
    expect(html).toContain('<svg')
  })

  it('renders title and description', () => {
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} />)

    expect(html).toContain('Sacred Teachings')
    expect(html).toContain('timeless wisdom')
  })

  it('renders the subtitle when provided', () => {
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} subtitle="Timeless teachings" />)

    expect(html).toContain('Timeless teachings')
  })

  it('defaults the decorative sidetext to "Ancient Wisdom"', () => {
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} />)

    expect(html).toContain('Ancient Wisdom')
  })

  it('honours a custom sidetext label', () => {
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} sidetext="Ancient Knowledge" />)

    expect(html).toContain('Ancient Knowledge')
    expect(html).not.toContain('Ancient Wisdom')
  })

  it('reverses the layout when align="right"', () => {
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} align="right" />)

    expect(html).toContain('lg:flex-row-reverse')
  })

  it('renders the CTA only when both text and href are set', () => {
    const without = renderToStaticMarkup(<OrnateTextBox {...BASE} />)

    expect(without).not.toContain('<a')

    const withCta = renderToStaticMarkup(
      <OrnateTextBox {...BASE} ctaHref="#" ctaText="Read more" />,
    )

    expect(withCta).toContain('Read more')
  })
})
