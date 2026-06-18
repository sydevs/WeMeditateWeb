import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { HeaderNavDropdown } from './HeaderNavDropdown'

const dropdown = {
  title: 'About Meditation',
  links: [{ label: 'History of Meditation', href: '/history-of-meditation' }],
  featuredArticles: [
    {
      title: 'A Featured Article',
      image: 'https://example.com/a.jpg',
      imageAlt: 'Art',
      href: '/a-featured-article',
    },
  ],
}

describe('HeaderNavDropdown', () => {
  it('renders a keyboard-focusable trigger with dialog popup semantics', () => {
    const html = renderToStaticMarkup(
      <HeaderNavDropdown dropdown={dropdown} label="About Meditation" />,
    )

    expect(html).toContain('About Meditation')
    // The trigger is a real <button> carrying the popup ARIA contract.
    expect(html).toContain('<button')
    expect(html).toContain('aria-haspopup="dialog"')
    expect(html).toContain('aria-expanded="false"')
  })

  it('does not render the panel until opened (closed by default)', () => {
    const html = renderToStaticMarkup(
      <HeaderNavDropdown dropdown={dropdown} label="About Meditation" />,
    )

    // Panel content (links/articles) is portal-rendered only when open.
    expect(html).not.toContain('History of Meditation')
    expect(html).not.toContain('A Featured Article')
  })
})
