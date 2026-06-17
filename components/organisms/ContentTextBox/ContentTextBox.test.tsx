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

    // Title and description still render; subtitle adds no extra <p>.
    expect(html).toContain('Get Connected')
    expect(html.match(/<p/g)?.length).toBe(1)
  })
})

describe('<ContentTextBox> overlay theme', () => {
  it('renders white text in overlay mode with theme="dark"', () => {
    const html = renderToStaticMarkup(<ContentTextBox {...BASE} align="center" theme="dark" />)

    expect(html).toContain('text-white')
    expect(html).toContain('text-glow-dark')
    expect(html).not.toContain('lg:bg-white')
  })

  it('renders dark text in overlay mode with theme="light" (default)', () => {
    const html = renderToStaticMarkup(<ContentTextBox {...BASE} align="center" />)

    expect(html).toContain('text-gray-900')
    expect(html).toContain('text-glow-light')
    expect(html).not.toContain('text-white')
  })

  it('ignores theme in side (left/right) mode — no overlay glow', () => {
    const html = renderToStaticMarkup(<ContentTextBox {...BASE} align="left" theme="dark" />)

    expect(html).not.toContain('text-white')
    expect(html).not.toContain('text-glow-dark')
    // Side layout keeps the white box treatment.
    expect(html).toContain('lg:bg-white')
  })
})

describe('<ContentTextBox> Ancient Wisdom styling', () => {
  it('renders the parchment box and floral ornament in side mode', () => {
    const html = renderToStaticMarkup(<ContentTextBox {...BASE} wisdomStyle align="left" />)

    expect(html).toContain('bg-warm')
    // The FloralDividerSvg ornament renders an <svg>.
    expect(html).toContain('<svg')
    expect(html).not.toContain('lg:bg-white')
  })

  it('is a no-op in overlay mode (no parchment box)', () => {
    const html = renderToStaticMarkup(<ContentTextBox {...BASE} wisdomStyle align="center" />)

    expect(html).not.toContain('bg-warm')
  })

  it('renders neither parchment nor ornament when wisdomStyle is unset', () => {
    const html = renderToStaticMarkup(<ContentTextBox {...BASE} align="left" />)

    expect(html).not.toContain('bg-warm')
    expect(html).not.toContain('<svg')
  })
})
