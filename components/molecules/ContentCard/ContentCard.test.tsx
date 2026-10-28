import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ContentCard } from './ContentCard'
import {
  CF_BASE,
  CF_PUBLIC_URL as THUMBNAIL,
  PASSTHROUGH_SOURCES,
} from '../../../tests/_helpers/cloudflare-images'

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

describe('ContentCard thumbnail variant', () => {
  const fixedHeight = renderToStaticMarkup(
    <ContentCard href="#" imageHeight="h-56" thumbnailSrc={THUMBNAIL} title="Fixed height" />,
  )

  // A fixed imageHeight used to drop `aspectRatio` outright, so <Image>
  // returned the src untouched and the card served the original (#146).
  it('requests a variant and a srcset with a fixed image height', () => {
    expect(fixedHeight).toContain(`src="${CF_BASE}/width=800"`)
    expect(fixedHeight).toContain(`${CF_BASE}/width=200 200w`)
    expect(fixedHeight).not.toContain('/public')
  })

  it('keeps the fixed-height, natural-width layout', () => {
    expect(fixedHeight).toContain('h-56 w-auto')
    // Not boxed, so the atom adds no ratio class of its own.
    expect(fixedHeight).not.toContain('aspect-square')
  })

  it('still boxes to the aspect ratio without a fixed image height', () => {
    const html = renderToStaticMarkup(
      <ContentCard href="#" thumbnailSrc={THUMBNAIL} title="Boxed" />,
    )

    expect(html).toContain('aspect-square')
  })

  it('forwards an explicit sizes to the image', () => {
    const html = renderToStaticMarkup(
      <ContentCard href="#" sizes="342px" thumbnailSrc={THUMBNAIL} title="Carousel slide" />,
    )

    expect(html).toContain('sizes="342px"')
  })

  it.each(PASSTHROUGH_SOURCES)('leaves %s unchanged, with no srcset', (_label, src) => {
    const html = renderToStaticMarkup(
      <ContentCard href="#" imageHeight="h-56" thumbnailSrc={src} title="Passthrough" />,
    )

    expect(html).toContain(`src="${src}"`)
    expect(html).not.toContain('srcSet=')
  })
})
