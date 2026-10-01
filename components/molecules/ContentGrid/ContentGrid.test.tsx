import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ContentGrid, type ContentGridItem } from './ContentGrid'

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
    const tags = articleTags(renderToStaticMarkup(<ContentGrid items={items} />))

    expect(tags).toHaveLength(2)

    for (const tag of tags) {
      expect(tag).not.toContain('opacity-0')
      expect(tag).not.toContain('transition-opacity duration-500')
    }
  })

  it('renders each card title in the server markup', () => {
    const html = renderToStaticMarkup(<ContentGrid items={items} />)

    expect(html).toContain('Alpha')
    expect(html).toContain('Beta')
  })

  it('sets no inline opacity on the server markup', () => {
    const html = renderToStaticMarkup(<ContentGrid items={items} />)

    expect(html).not.toContain('opacity:0')
    expect(html).not.toContain('opacity: 0')
  })
})
