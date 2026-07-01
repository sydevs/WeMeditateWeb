import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ContentCard } from './ContentCard'

/** Class attribute of the outer <article> (where fadeInOnLoad opacity lives). */
function articleClass(html: string): string {
  return (html.match(/<article[^>]*class="([^"]*)"/) || [])[1] ?? ''
}

describe('ContentCard fadeInOnLoad visibility', () => {
  it('stays visible when there is no image to load (no <img> → onLoad never fires)', () => {
    const cls = articleClass(
      renderToStaticMarkup(<ContentCard fadeInOnLoad href="#" thumbnailSrc="" title="No image" />),
    )

    expect(cls).toContain('opacity-100')
    expect(cls).not.toContain('opacity-0')
  })

  it('renders a branded 16:9 fallback (Placeholder + white Logo, no <img>) when imageless', () => {
    const html = renderToStaticMarkup(<ContentCard href="#" thumbnailSrc="" title="No image" />)

    expect(html).not.toContain('<img') // no image element for a blank src
    expect(html).toContain('aspect-video') // fixed 16:9 fallback box
    expect(html).toContain('from-teal-100') // coloured (primary) Placeholder gradient
    expect(html).not.toContain('animate-shimmer') // non-animated
    expect(html).toContain('<svg') // the centered Logo
    expect(html).toContain('text-white') // white logo
  })

  it('starts hidden (opacity-0) when an image will load and can fade in', () => {
    const cls = articleClass(
      renderToStaticMarkup(
        <ContentCard
          fadeInOnLoad
          href="#"
          thumbnailSrc="https://imagedelivery.net/acct/img/"
          title="Has image"
        />,
      ),
    )

    expect(cls).toContain('opacity-0')
  })

  it('applies no opacity gating without fadeInOnLoad', () => {
    const cls = articleClass(
      renderToStaticMarkup(<ContentCard href="#" thumbnailSrc="" title="Plain" />),
    )

    expect(cls).not.toContain('opacity-0')
    expect(cls).not.toContain('transition-opacity duration-500')
  })
})
