import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ContentOverlay } from './ContentOverlay'

const BASE = {
  title: 'Get Connected',
  text: 'Meditation is even stronger when shared.',
  imageSrc: 'https://picsum.photos/seed/x/1600/900',
  imageAlt: 'Meditation',
} as const

// The variant segment is how SahajCloud spells an upload URL — see
// `cloudflareImagesAdapter.ts` in sydevs/SahajCloud. A bare `…/<id>/` is a
// shape no read produces.
const CLOUDFLARE_SRC = 'https://imagedelivery.net/acct/img-id/public'

describe('<ContentOverlay> subtitle', () => {
  it('renders the subtitle when provided', () => {
    const html = renderToStaticMarkup(<ContentOverlay {...BASE} subtitle="Collective meditation" />)

    expect(html).toContain('Collective meditation')
  })

  it('omits the subtitle when not provided', () => {
    const html = renderToStaticMarkup(<ContentOverlay {...BASE} />)

    expect(html).not.toContain('Collective meditation')
  })

  it('applies the surface text colour to the subtitle (white on a dark surface)', () => {
    const html = renderToStaticMarkup(
      <ContentOverlay {...BASE} subtitle="Find your center" surface="dark" />,
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

  it('resolves a Cloudflare variant and the full-bleed slot width on both branches', () => {
    const html = renderToStaticMarkup(<ContentOverlay {...BASE} imageSrc={CLOUDFLARE_SRC} />)
    const images = html.match(/<img[^>]*>/g) ?? []

    expect(images.filter((img) => img.includes('srcSet='))).toHaveLength(2)
    expect(images.filter((img) => img.includes('sizes="100vw"'))).toHaveLength(2)
  })

  it('points both branches at one picture, so a visitor downloads it once', () => {
    // A hidden <img> is still fetched, so before #150 a desktop visitor took
    // the desktop branch's `width=800` variant *and* the mobile branch's
    // unresolved `/public` original.
    const html = renderToStaticMarkup(<ContentOverlay {...BASE} imageSrc={CLOUDFLARE_SRC} />)
    const sources = [...html.matchAll(/<img[^>]*\ssrc="([^"]*)"/g)].map(([, src]) => src)

    expect(sources).toHaveLength(2)
    expect(new Set(sources).size).toBe(1)
    expect(sources[0]).toBe('https://imagedelivery.net/acct/img-id/width=800')
  })
})
