import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ContentGrid, type ContentGridItem } from './ContentGrid'
import { CF_PUBLIC_URL } from '@/tests/_helpers/cloudflare-images'

const GRID_SIZES = '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 360px'

const items: ContentGridItem[] = [
  { id: 1, title: 'Alpha', href: '#1', thumbnailSrc: 'https://imagedelivery.net/acct/a/' },
  { id: 2, title: 'Beta', href: '#2', thumbnailSrc: 'https://imagedelivery.net/acct/b/' },
]

/** Every <article …> opening tag in the markup — one per card. */
function articleTags(html: string): string[] {
  return html.match(/<article[^>]*>/g) ?? []
}

describe('ContentGrid first-render visibility', () => {
  it('renders every card visible, thumbnails and all', () => {
    const tags = articleTags(renderToStaticMarkup(<ContentGrid items={items} sizes={GRID_SIZES} />))

    expect(tags).toHaveLength(2)

    for (const tag of tags) {
      expect(tag).not.toContain('opacity-0')
      expect(tag).not.toContain('transition-opacity duration-500')
    }
  })

  it('renders each card title in the server markup', () => {
    const html = renderToStaticMarkup(<ContentGrid items={items} sizes={GRID_SIZES} />)

    expect(html).toContain('Alpha')
    expect(html).toContain('Beta')
  })

  it('sets no inline opacity on the server markup', () => {
    const html = renderToStaticMarkup(<ContentGrid items={items} sizes={GRID_SIZES} />)

    expect(html).not.toContain('opacity:0')
    expect(html).not.toContain('opacity: 0')
  })
})

describe('ContentGrid sizes', () => {
  it("declares the grid's length on every card it renders", () => {
    const html = renderToStaticMarkup(
      <ContentGrid
        items={[{ id: 1, title: 'Alpha', href: '#1', thumbnailSrc: CF_PUBLIC_URL }]}
        sizes={GRID_SIZES}
      />,
    )

    expect(html).toContain(`sizes="${GRID_SIZES}"`)
  })

  it("lets an item's own sizes win, even spelled as an explicit undefined", () => {
    const own = renderToStaticMarkup(
      <ContentGrid
        items={[{ id: 1, title: 'Alpha', href: '#1', sizes: '200px', thumbnailSrc: CF_PUBLIC_URL }]}
        sizes={GRID_SIZES}
      />,
    )

    expect(own).toContain('sizes="200px"')

    // A caller spreading a wider shape can carry `sizes: undefined`, which a
    // pre-spread default would hand on as the card's own (#206).
    const blank = renderToStaticMarkup(
      <ContentGrid
        items={[
          { id: 1, title: 'Alpha', href: '#1', sizes: undefined, thumbnailSrc: CF_PUBLIC_URL },
        ]}
        sizes={GRID_SIZES}
      />,
    )

    expect(blank).toContain(`sizes="${GRID_SIZES}"`)
  })
})
