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
    it('gives the banner logo and action link the dark ring on a dark splash', () => {
      // `LayoutChrome` passes `theme={leadSplash?.theme}`, so these two sit on a
      // photograph. A caller that forgets `theme` draws `Link`'s light ring and
      // a white offset band over it — the defect #133 exists to remove.
      const html = render({ theme: 'dark' })

      expect(html).not.toContain('focus-visible:ring-teal-600')
      expect(html).not.toContain('focus-visible:ring-offset-white')
      expect(html).toContain('focus-visible:ring-white')
    })

    it('keeps the light ring on the sticky nav, which paints itself white', () => {
      // The compact logo and map-pin stay tabbable while transparent, so their
      // ring follows `theme` until the nav sticks, then turns light with it.
      // Matched on the map-pin's own anchor: the nav Buttons beside it also
      // turn light when sticky, so a bare substring would pass without it.
      const html = render({ condensed: true, theme: 'dark' })
      const mapPin = html.match(/class="([^"]*hover:opacity-75[^"]*)"/)?.[1]

      expect(mapPin).toContain('focus-visible:ring-teal-600')
      expect(mapPin).not.toContain('focus-visible:ring-white')
    })
  })
})
