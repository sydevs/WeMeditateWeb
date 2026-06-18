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
  it('renders the warm ornate ground and the floral graphic', () => {
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} />)

    // Warm-brown gradient ground (distinctive to the ornate treatment).
    expect(html).toContain('#6b5340')
    // The decorative ornate.svg graphic is rendered as a background image.
    expect(html).toContain('ornate')
  })

  it('renders title and description', () => {
    const html = renderToStaticMarkup(<OrnateTextBox {...BASE} />)

    expect(html).toContain('Sacred Teachings')
    expect(html).toContain('timeless wisdom')
  })

  it('splits the description into paragraphs on newlines', () => {
    const html = renderToStaticMarkup(
      <OrnateTextBox {...BASE} description={'First paragraph.\n\nSecond paragraph.'} />,
    )

    expect(html).toContain('<p>First paragraph.</p>')
    expect(html).toContain('<p>Second paragraph.</p>')
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

  it('floats the title+image column left by default, right when align="right"', () => {
    expect(renderToStaticMarkup(<OrnateTextBox {...BASE} />)).toContain('lg:float-left')
    expect(renderToStaticMarkup(<OrnateTextBox {...BASE} align="right" />)).toContain(
      'lg:float-right',
    )
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
