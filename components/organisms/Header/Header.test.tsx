import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Header } from './Header'

const navItems = [{ label: 'Meditate Now', href: '/meditate' }]

const render = (props: Partial<React.ComponentProps<typeof Header>> = {}) =>
  renderToStaticMarkup(
    <Header actionLinkHref="/classes" actionLinkText="Classes near me" navItems={navItems} {...props} />,
  )

describe('Header', () => {
  it('renders the full banner by default', () => {
    const html = render()

    // The banner carries the decorative illustration. The condensed bar does not.
    expect(html).toContain('<svg')
    expect(html).toContain('Classes near me')
    expect(html).toContain('Meditate Now')
  })

  describe('condensed', () => {
    it('drops the banner but keeps the nav', () => {
      // `/map` gives the viewport to the atlas, so the tall banner is chrome the
      // page has no room for — the compact nav carries the logo and action link.
      const html = render({ condensed: true })

      expect(html).not.toContain('Classes near me')
      expect(html).toContain('Meditate Now')
    })

    it('pins the nav in the state it otherwise animates into on scroll', () => {
      // Server-rendered, so this is the first-paint state: no observer has run.
      // Without `condensed` the nav starts un-sticky and the logo is hidden.
      const condensed = render({ condensed: true })
      const normal = render()

      // `opacity-0 pointer-events-none` is the exact hidden state the compact
      // logo and map-pin carry until the nav sticks. Asserted as the whole pair
      // because `opacity-0` alone also matches unrelated Button classes.
      expect(condensed).toContain('bg-white')
      expect(condensed).not.toContain('opacity-0 pointer-events-none')
      expect(normal).toContain('opacity-0 pointer-events-none')
    })

    it('renders nothing extra when there are no nav items', () => {
      expect(render({ condensed: true, navItems: [] })).not.toContain('<nav')
    })
  })

  describe('focus ring', () => {
    it('puts the banner on the dark surface its splash paints', () => {
      // `LayoutChrome` passes `theme={leadSplash?.theme}`, so the banner logo
      // and action link sit on a photograph. They take no `theme` of their own
      // and inherit the ring from the `<header>` (#133).
      const banner = render({ theme: 'dark' }).split('</header>')[0]

      expect(banner).toMatch(/^<header class="surface-dark\b/)
      expect(banner).not.toContain('surface-light')
    })

    it('turns the sticky nav light, since it paints itself white', () => {
      // The compact logo and map-pin stay tabbable while transparent, so the
      // nav's surface follows `theme` until it sticks.
      const nav = (props: Partial<React.ComponentProps<typeof Header>>) =>
        render(props).match(/<nav class="([^"]*)"/)?.[1]

      expect(nav({ condensed: true, theme: 'dark' })).toContain('surface-light')
      expect(nav({ theme: 'dark' })).toContain('surface-dark')
    })
  })
})
