import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MobileMenu } from './MobileMenu'
import type { NavItem } from '../Header'
import { openTag } from '../../../tests/_helpers/markup'

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
    // `common.a11y.menu` in lib/translations.en.json. The same name is read in
    // both states, so `aria-expanded` is what carries the state.
    const trigger = openTag(render(), 'button')

    expect(trigger).toContain('aria-label="Menu"')
    expect(trigger).toContain('aria-expanded="false"')
    expect(trigger).toContain('aria-haspopup="dialog"')
    // `Button` guarantees 44×44 itself. #202 is what a hand-rolled one costs.
    expect(trigger).not.toContain('min-h-11')
  })

  it('renders no panel until it is opened', () => {
    const html = render()

    expect(html).not.toContain('History of Meditation')
    expect(html).not.toContain('Meditate Now')
  })
})
