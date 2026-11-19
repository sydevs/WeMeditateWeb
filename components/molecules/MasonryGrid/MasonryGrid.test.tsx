import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MasonryGrid, type MasonryGridItem } from './MasonryGrid'
import { anchorFor, classFor, classOf, openTag } from '../../../tests/_helpers/markup'

const items: MasonryGridItem[] = Array.from({ length: 5 }, (_, index) => ({
  id: index,
  title: `Heading ${index + 1}`,
  text: `Content ${index + 1}`,
}))

/** Each `<li …>` opening tag, in document order. */
const itemTags = (html: string) => html.match(/<li[^>]*>/g) ?? []

describe('MasonryGrid', () => {
  // The accessible name must contain the visible label (WCAG 2.1 2.5.3), so
  // a count the label does not show cannot be the name (#201).
  it('names the show-more button with the text it draws', () => {
    const html = renderToStaticMarkup(<MasonryGrid items={items} initialItemCount={3} />)
    const at = html.indexOf('Show More')

    expect(at).toBeGreaterThan(-1)
    expect(html.slice(html.lastIndexOf('<button', at), at)).not.toContain('aria-label')
  })

  it('describes the button by how many items it reveals', () => {
    const html = renderToStaticMarkup(<MasonryGrid items={items} initialItemCount={3} />)
    const button = openTag(html, 'button')
    const describedBy = button.split('aria-describedby="')[1]?.split('"')[0] ?? ''

    expect(button).not.toBe('')
    expect(describedBy).not.toBe('')
    expect(html).toContain(`id="${describedBy}">Show 2 more items</span>`)
  })

  // The old site showed three of the eleven timeline entries and a button.
  // Every entry still reaches the server's markup; the rest wait hidden, out
  // of the accessibility tree and the tab order.
  it('shows the first page only, and keeps the rest in the markup, hidden', () => {
    const html = renderToStaticMarkup(<MasonryGrid initialItemCount={3} items={items} />)
    const tags = itemTags(html)

    expect(html).toContain('Heading 5')
    expect(tags).toHaveLength(5)
    expect(tags.slice(0, 3).every((tag) => !tag.includes('hidden'))).toBe(true)
    expect(tags.slice(3).every((tag) => tag.includes('hidden'))).toBe(true)
    expect(html).toContain('Show More')
  })

  it('draws no button when every item fits', () => {
    const html = renderToStaticMarkup(<MasonryGrid items={items.slice(0, 3)} />)

    expect(html).toContain('Heading 3')
    expect(html).not.toContain('Show More')
    expect(itemTags(html).some((tag) => tag.includes('hidden'))).toBe(false)
  })

  // A script-built masonry dealt items out to columns, so the fourth sat second in
  // the markup, and a timeline read out of order.
  it('keeps the items in the order given, in one grid', () => {
    const html = renderToStaticMarkup(<MasonryGrid items={items} />)
    const at = items.map(({ title }) => html.indexOf(title ?? ''))

    expect(at.every((index) => index > -1)).toBe(true)
    expect([...at].sort((a, b) => a - b)).toEqual(at)
    expect(classFor(html, 'masonry')).not.toBe('')
    expect(html).not.toContain('style=')
  })

  // A linked title used to leave the heading out altogether, so one item of a
  // row joined the outline and the next did not.
  it('takes the heading level from the caller, and keeps a link inside it', () => {
    const html = renderToStaticMarkup(
      <MasonryGrid
        headingLevel="h2"
        items={[
          { id: 'a', title: 'Linked', href: '/live', text: 'Join online.' },
          { id: 'b', title: 'Plain', text: 'Nothing to follow.' },
        ]}
      />,
    )
    const anchor = anchorFor(html, '/live')
    const at = html.indexOf(anchor)

    expect(anchor).not.toBe('')
    expect(html.slice(html.lastIndexOf('<', at - 1), at)).toMatch(/^<h2/)
    expect(html.slice(html.lastIndexOf('<', html.indexOf('Plain')))).toMatch(/^<h2/)
    expect(html).not.toContain('<h3')
  })

  it("keeps the text's own line breaks, and draws an item's image", () => {
    const html = renderToStaticMarkup(
      <MasonryGrid
        items={[
          {
            id: 'a',
            title: 'Evening',
            text: 'Let the day go.\nSit before bed.',
            image: {
              src: 'https://imagedelivery.net/acct/evening/public',
              alt: 'Dusk over hills',
            },
          },
        ]}
      />,
    )

    expect(classOf(html, 'Let the day go.').split(' ')).toContain('whitespace-pre-line')
    expect(html).toContain('alt="Dusk over hills"')
  })
})
