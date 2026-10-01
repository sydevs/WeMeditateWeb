import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ContentCard } from './ContentCard'

const THUMBNAIL = 'https://imagedelivery.net/acct/img/'

/** Class attribute of the outer <article>, which gates the whole card. */
function articleClass(html: string): string {
  return (html.match(/<article[^>]*class="([^"]*)"/) || [])[1] ?? ''
}

describe('ContentCard first-render visibility', () => {
  it('renders the card visible when a thumbnail will load', () => {
    const cls = articleClass(
      renderToStaticMarkup(<ContentCard href="#" thumbnailSrc={THUMBNAIL} title="Has image" />),
    )

    expect(cls).not.toContain('opacity-0')
    expect(cls).not.toContain('transition-opacity duration-500')
  })

  it('renders the card visible when there is no thumbnail', () => {
    const cls = articleClass(
      renderToStaticMarkup(<ContentCard href="#" thumbnailSrc="" title="No image" />),
    )

    expect(cls).not.toContain('opacity-0')
    expect(cls).not.toContain('transition-opacity duration-500')
  })

  it('puts the title and description in markup that nothing hides', () => {
    const html = renderToStaticMarkup(
      <ContentCard
        description="Unconditional love sounds hard."
        href="#"
        thumbnailSrc={THUMBNAIL}
        title="Feel Love"
      />,
    )

    expect(html).toContain('Feel Love')
    expect(html).toContain('Unconditional love sounds hard.')
    expect(articleClass(html)).not.toContain('opacity-0')
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
})
