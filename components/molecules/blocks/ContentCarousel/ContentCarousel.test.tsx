import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ContentCarousel } from './ContentCarousel'
import { CF_PUBLIC_URL } from '../../../../tests/_helpers/cloudflare-images'

const items = [{ title: 'Feel Love', href: '/m/love', thumbnailSrc: CF_PUBLIC_URL }]

describe('<ContentCarousel> slide sizes', () => {
  // A slide renders `height × ratio` wide, so the row's three heights become
  // three lengths — and a square card must not inherit the 16:9 figure.
  it.each([
    ['sm', '(min-width: 1024px) 192px, (min-width: 640px) 176px, 160px'],
    ['md', '(min-width: 1024px) 256px, (min-width: 640px) 224px, 192px'],
    ['lg', '(min-width: 1024px) 288px, (min-width: 640px) 256px, 224px'],
  ] as const)('advertises a square %s slide at its own row heights', (size, sizes) => {
    const html = renderToStaticMarkup(<ContentCarousel items={items} size={size} />)

    expect(html).toContain(`sizes="${sizes}"`)
    expect(html).not.toContain('/public')
  })

  // The same row, 1.78x wider per slide, because the box follows the item.
  it('widens the lengths for a 16:9 slide in the same row', () => {
    const html = renderToStaticMarkup(
      <ContentCarousel items={[{ ...items[0], aspectRatio: 'video' }]} size="lg" />,
    )

    expect(html).toContain('sizes="(min-width: 1024px) 512px, (min-width: 640px) 456px, 399px"')
  })

  it('lets an item override the derived sizes', () => {
    const html = renderToStaticMarkup(
      <ContentCarousel items={[{ ...items[0], sizes: '200px' }]} size="lg" />,
    )

    expect(html).toContain('sizes="200px"')
    expect(html).not.toContain('(min-width: 1024px) 288px')
  })
})
