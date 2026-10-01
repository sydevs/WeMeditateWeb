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

describe('<ContentOverlay> image loading', () => {
  it('renders both breakpoints lazily, so neither hoists a preload link', () => {
    const html = renderToStaticMarkup(<ContentOverlay {...BASE} />)
    const images = html.match(/<img[^>]*>/g) ?? []

    expect(html).not.toContain('rel="preload"')
    expect(images).toHaveLength(2)
    images.forEach((img) => expect(img).toContain('loading="lazy"'))
  })

  it('resolves a Cloudflare variant and the full-bleed slot width on the desktop branch', () => {
    const html = renderToStaticMarkup(
      <ContentOverlay {...BASE} imageSrc="https://imagedelivery.net/acct/img-id/" />,
    )
    const images = html.match(/<img[^>]*>/g) ?? []

    expect(images.filter((img) => img.includes('srcSet='))).toHaveLength(1)
    expect(images.filter((img) => img.includes('sizes="100vw"'))).toHaveLength(1)
  })
})
