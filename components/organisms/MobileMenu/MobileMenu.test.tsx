import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MobileMenu } from './MobileMenu'
import type { NavItem } from '../Header/Header'

const navItems: NavItem[] = [
  { label: 'Meditate Now', href: '/meditate' },
  {
    label: 'About Meditation',
    dropdown: {
      title: 'About Meditation',
      links: [{ label: 'History of Meditation', href: '/history-of-meditation' }],
      featuredArticles: [],
    },
  },
]

const render = () => renderToStaticMarkup(<MobileMenu navItems={navItems} />)

describe('MobileMenu', () => {
  it('names its trigger from the content system, in the closed state', () => {
    const html = render()

    // `common.a11y.menu` in lib/translations.en.json. The same name is read in
    // both states, so `aria-expanded` is what carries the state.
    expect(html).toContain('aria-label="Menu"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('aria-haspopup="dialog"')
  })

  it('leaves the touch target to the atom', () => {
    // `Button` guarantees 44×44 itself, and the bar is pinned at `top-0`, where
    // a hand-rolled overlay or a `min-h-11` is how #202 measured 44×31.
    const trigger = render().match(/<button[^>]*>/)?.[0]

    expect(trigger).toContain('touch-target-overlay')
    expect(trigger).not.toContain('min-h-11')
  })

  it('renders no panel until it is opened', () => {
    // The panel is portal-rendered, so the server HTML carries none of it —
    // which is also why nothing in it can scroll the first paint sideways.
    const html = render()

    expect(html).not.toContain('History of Meditation')
    expect(html).not.toContain('Meditate Now')
  })
})
