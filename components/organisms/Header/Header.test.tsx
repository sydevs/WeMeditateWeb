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
    expect(html).toContain('>Classes near me<')
    expect(html).toContain('Meditate Now')
  })

  describe('condensed', () => {
    it('drops the banner but keeps the nav', () => {
      // `/map` gives the viewport to the atlas, so the tall banner is chrome the
      // page has no room for — the compact nav carries the logo and action link.
      const html = render({ condensed: true })

      // Matched as element text, because the compact bar's map pin carries the
      // same string as its `aria-label`.
      expect(html).not.toContain('>Classes near me<')
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

  describe('the sticky nav row', () => {
    it('renders only at lg and above', () => {
      // The pair, not `hidden` alone, which also matches `lg:hidden`.
      const row = render().match(/<div class="([^"]*max-w-3xl flex-1[^"]*)"/)?.[1]

      expect(row).toContain('hidden lg:flex')
    })
  })

  describe('the compact bar below lg', () => {
    it('grows its two controls to 44x44 rather than hanging an overlay off them', () => {
      // The bar is pinned at `top-0`, so below `lg:` — where the nav row is
      // hidden — the viewport clipped a centred `::before` to 44x31. A grown box
      // cannot be clipped, and it floors the bar from its own content.
      const html = render()
      const bar = html.match(/<div class="([^"]*max-w-5xl mx-auto px-6[^"]*)"/)?.[1]

      expect(bar).not.toContain('min-h-11')
      expect(html).toContain('shrink-0 touch-target items-center')
      expect(html).toContain('flex touch-target items-center justify-end')
      expect(html).not.toContain('touch-target-overlay')
    })

    it('is not drawn at all until it sticks', () => {
      // Un-stuck it holds nothing visible, so its two rules would read as an
      // empty 44px gap on every mobile page.
      const navClass = (html: string) => html.match(/<nav class="([^"]*)"/)?.[1]

      expect(navClass(render())).toContain('hidden lg:block')
      expect(navClass(render({ condensed: true }))).not.toContain('hidden')
    })

    it('names both controls, since each renders an icon alone', () => {
      // `common.general.site_title` in lib/translations.en.json; the pin takes
      // the class page's own already-translated title.
      const html = render()

      expect(html).toContain('aria-label="We Meditate"')
      expect(html).toContain('aria-label="Classes near me"')
    })
  })

  describe('surface', () => {
    // The banner overlays the lead splash, so it takes the splash's surface
    // from `LayoutChrome`'s wrapper rather than claiming one (#133).
    it('claims no surface of its own until the nav sticks', () => {
      const html = render()

      expect(html).not.toContain('surface-')
      expect(html).toContain('text-fg-muted')
    })

    it('turns the sticky nav light, since it paints itself white', () => {
      const nav = render({ condensed: true }).match(/<nav class="([^"]*)"/)?.[1]

      expect(nav).toContain('surface-light')
      expect(nav).toContain('bg-white')
    })
  })
})
