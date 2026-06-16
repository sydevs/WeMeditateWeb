import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { TableOfContents } from './TableOfContents'

describe('<TableOfContents>', () => {
  it('renders nothing when there are no headings', () => {
    expect(renderToStaticMarkup(<TableOfContents headings={[]} />)).toBe('')
  })

  it('derives anchors from the heading text (not the stored slug) and shows the title', () => {
    const html = renderToStaticMarkup(
      <TableOfContents
        headings={[{ slug: 'stale-slug', text: 'When to do it?', level: 2 }]}
        title="Explore below"
      />,
    )

    // Anchor matches what the heading converter emits (slugify of the text),
    // not the slug the CMS happened to store.
    expect(html).toContain('href="#when-to-do-it"')
    expect(html).not.toContain('stale-slug')
    expect(html).toContain('When to do it?')
    expect(html).toContain('Explore below')
  })

  it('indents headings by level relative to the shallowest one', () => {
    const html = renderToStaticMarkup(
      <TableOfContents
        headings={[
          { slug: 'a', text: 'How to do it', level: 2 },
          { slug: 'b', text: 'At the beginning', level: 3 },
        ]}
      />,
    )

    expect(html).toContain('href="#at-the-beginning"')
    // level 3 is one step below the shallowest (level 2) → pl-4
    expect(html).toContain('pl-4')
  })
})
