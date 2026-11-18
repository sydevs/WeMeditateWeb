import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MasonryGrid } from './MasonryGrid'

const items = Array.from({ length: 5 }, (_, index) => ({
  id: index,
  heading: `Heading ${index + 1}`,
  content: `Content ${index + 1}`,
}))

describe('MasonryGrid', () => {
  // The accessible name must contain the visible label (WCAG 2.1 2.5.3), so
  // a count the label does not show cannot be the name (#201).
  it('names the show-more button with the text it draws', () => {
    const html = renderToStaticMarkup(<MasonryGrid items={items} initialItemCount={3} />)
    const at = html.indexOf('Show More')

    expect(at).toBeGreaterThan(-1)
    expect(html.slice(html.lastIndexOf('<button', at), at)).not.toContain('aria-label')
  })

  it('shows the first page only, and a way to the rest', () => {
    const html = renderToStaticMarkup(<MasonryGrid items={items} initialItemCount={3} />)

    expect(html).toContain('Heading 3')
    expect(html).not.toContain('Heading 4')
    expect(html).toContain('Show More')
  })
})
