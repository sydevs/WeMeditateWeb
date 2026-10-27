import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ContentCard } from './ContentCard'

// The shape a SahajCloud read sends: `…/<image_id>/public`
// (sydevs/SahajCloud `src/plugins/storage/cloudflareImagesAdapter.ts:203`).
const THUMBNAIL = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123/public'
const BASE = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123'

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
  // A fixed imageHeight used to drop `aspectRatio` outright, so <Image>
  // returned the src untouched and the card served the original (#146).
  it('requests a variant and a srcset with a fixed image height', () => {
    const html = renderToStaticMarkup(
      <ContentCard href="#" imageHeight="h-56" thumbnailSrc={THUMBNAIL} title="Fixed height" />,
    )

    expect(html).toContain(`src="${BASE}/width=800"`)
    expect(html).toContain(`${BASE}/width=200 200w`)
    expect(html).not.toContain('/public')
  })

  it('keeps the fixed-height, natural-width layout', () => {
    const html = renderToStaticMarkup(
      <ContentCard href="#" imageHeight="h-56" thumbnailSrc={THUMBNAIL} title="Fixed height" />,
    )

    expect(html).toContain('h-56 w-auto')
    // Not boxed: no ratio class on the wrapper, and the <img> stays in flow.
    expect(html).not.toContain('aspect-square')
    expect(html).not.toContain('absolute inset-0 w-full h-full')
  })

  it('still boxes to the aspect ratio without a fixed image height', () => {
    const html = renderToStaticMarkup(
      <ContentCard href="#" thumbnailSrc={THUMBNAIL} title="Boxed" />,
    )

    expect(html).toContain('aspect-square')
    expect(html).toContain('absolute inset-0 w-full h-full')
  })

  it('forwards an explicit sizes to the image', () => {
    const html = renderToStaticMarkup(
      <ContentCard href="#" sizes="342px" thumbnailSrc={THUMBNAIL} title="Carousel slide" />,
    )

    expect(html).toContain('sizes="342px"')
  })

  it.each([
    ['a bundled asset', '/assets/smnd.webp'],
    ['a story placeholder', 'https://picsum.photos/seed/card/400/400'],
    ['the SahajCloud dev fallback', '/api/media/file/card.jpg'],
  ])('leaves %s unchanged, with no srcset', (_label, src) => {
    const html = renderToStaticMarkup(
      <ContentCard href="#" imageHeight="h-56" thumbnailSrc={src} title="Passthrough" />,
    )

    expect(html).toContain(`src="${src}"`)
    expect(html).not.toContain('srcSet=')
  })
})
