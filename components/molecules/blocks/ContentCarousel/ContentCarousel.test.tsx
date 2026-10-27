import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ContentCarousel } from './ContentCarousel'

// The shape a SahajCloud read sends: `…/<image_id>/public`
// (sydevs/SahajCloud `src/plugins/storage/cloudflareImagesAdapter.ts:203`).
const CF_PUBLIC_URL = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123/public'

const items = [{ title: 'Feel Love', href: '/m/love', thumbnailSrc: CF_PUBLIC_URL }]

describe('<ContentCarousel> slide sizes', () => {
  // A slide's width is its image's natural width, so each size advertises
  // its own row height at 16:9 rather than the atom's full-width default.
  it.each([
    ['sm', '342px'],
    ['md', '456px'],
    ['lg', '512px'],
  ] as const)('advertises %s slides as %s', (size, sizes) => {
    const html = renderToStaticMarkup(<ContentCarousel items={items} size={size} />)

    expect(html).toContain(`sizes="${sizes}"`)
    expect(html).not.toContain('/public')
  })

  it('lets an item override the derived sizes', () => {
    const html = renderToStaticMarkup(
      <ContentCarousel items={[{ ...items[0], sizes: '200px' }]} size="lg" />,
    )

    expect(html).toContain('sizes="200px"')
    expect(html).not.toContain('sizes="512px"')
  })
})
