import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ContentOverlay } from './ContentOverlay'

const BASE = {
  title: 'Get Connected',
  text: 'Meditation is even stronger when shared.',
  imageSrc: 'https://picsum.photos/seed/x/1600/900',
  imageAlt: 'Meditation',
} as const

describe('<ContentOverlay> subtitle', () => {
  it('renders the subtitle when provided', () => {
    const html = renderToStaticMarkup(<ContentOverlay {...BASE} subtitle="Collective meditation" />)

    expect(html).toContain('Collective meditation')
  })

  it('omits the subtitle when not provided', () => {
    const html = renderToStaticMarkup(<ContentOverlay {...BASE} />)

    expect(html).not.toContain('Collective meditation')
  })

  it('applies the theme text colour to the subtitle (white on dark theme)', () => {
    const html = renderToStaticMarkup(
      <ContentOverlay {...BASE} subtitle="Find your center" theme="dark" />,
    )

    expect(html).toContain('text-white')
  })
})
