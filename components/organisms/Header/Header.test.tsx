import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Header } from './Header'
import { classesWith, classFor, classOf, tagFor } from '../../../tests/_helpers/markup'

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

      // `invisible` is the hidden state the compact logo and map-pin carry
      // until the nav sticks, and nothing else in the header carries it.
      expect(condensed).toContain('bg-white')
      expect(classesWith(condensed, 'invisible')).toHaveLength(0)
      expect(classesWith(normal, 'invisible')).toHaveLength(2)
    })

    it('renders nothing extra when there are no nav items', () => {
      expect(render({ condensed: true, navItems: [] })).not.toContain('<nav')
    })
  })

  describe('the sticky nav row', () => {
    it('renders only at lg and above', () => {
      const row = classFor(render(), 'max-w-3xl').split(' ')

      expect(row).toContain('hidden')
      expect(row).toContain('lg:flex')
    })

    it('sizes every item by its own label rather than by a count', () => {
      // `basis-1/4` forced four equal columns against the `featuredPages` list
      // `useSiteNav` maps, so a fifth entry wrapped every label and grew the
      // bar by 12px. `px-0` only compensated for the columns being too narrow.
      const html = render()

      expect(html).not.toContain('basis-1/4')
      expect(html).not.toContain('px-0')
    })
  })

  describe('the compact bar below lg', () => {
    it('grows its two controls to 44x44 rather than hanging an overlay off them', () => {
      // The bar is pinned at `top-0`, so below `lg:` — where the nav row is
      // hidden — the viewport clipped a centred `::before` to 44x31. A grown box
      // cannot be clipped, and it floors the bar from its own content.
      const html = render()
      const bar = classFor(html, 'max-w-5xl')

      expect(bar).not.toContain('min-h-11')
      expect(html).toContain('shrink-0 touch-target items-center')
      expect(html).toContain('flex touch-target items-center justify-end')
      // The menu trigger brings exactly one overlay into the bar, and the bar
      // is still the clipping edge. A second is the #202 shape again.
      expect(html.match(/touch-target-overlay/g)).toHaveLength(1)
    })

    it('is drawn before it sticks, because the menu trigger lives in it', () => {
      // The trigger inside it is visible and un-gated, so a bar that hid itself
      // below `lg:` would leave a phone no menu at all until it scrolled past
      // the banner.
      const navClasses = (html: string) => classOf(html, '<nav').split(' ')

      expect(navClasses(render())).not.toContain('hidden')
      expect(navClasses(render({ condensed: true }))).not.toContain('hidden')
    })

    it('carries the menu trigger, un-gated by the sticky state', () => {
      // `compactControl` is `opacity-0 invisible` until the nav sticks, which
      // takes an element out of the a11y tree and the tab order with it. The
      // trigger shares nothing with the bar's two existing icons, so the count
      // asserted below stays at two.
      const trigger = tagFor(render(), 'button', 'aria-label="Menu"')

      expect(trigger).toContain('lg:hidden')
      expect(trigger).not.toContain('opacity-0')
    })

    it('lands the trigger on the right edge rather than between the two controls', () => {
      // `justify-between` over three space-taking boxes centred it. The logo's
      // auto margin spends that space instead, and the trigger is last in the
      // row, so it holds the edge the map pin takes once stuck.
      const html = render()
      const logo = tagFor(html, 'a', 'aria-label="We Meditate"')

      expect(logo).toContain('max-lg:mr-auto')
      expect(html).toContain('aria-label="Classes near me"')
      expect(html.indexOf('aria-label="Menu"')).toBeGreaterThan(
        html.indexOf('aria-label="Classes near me"'),
      )
    })

    it('takes both faded controls out of the tab order', () => {
      // `pointer-events-none` stopped the mouse and nothing else, so at `lg:`
      // un-stuck a keyboard reached two invisible named links (SC 2.4.7).
      const html = render()

      // Both controls: `Button` carries a `disabled:pointer-events-none` of
      // its own, so the absence of the old class is not assertable here.
      expect(classesWith(html, 'invisible')).toHaveLength(2)
    })

    it('names both controls, since each renders an icon alone', () => {
      // `common.general.site_title` in lib/translations.en.json; the pin takes
      // the class page's own already-translated title.
      const html = render()

      expect(html).toContain('aria-label="We Meditate"')
      expect(html).toContain('aria-label="Classes near me"')
    })
  })

  describe('the page band', () => {
    const band = 'max-w-7xl mx-auto px-6'

    it('reaches the banner and the un-stuck nav, which cannot take it from a wrapper', () => {
      // A wrapper would be the sticky nav's containing block, so the nav would
      // stop pinning one header-height down the page (#204).
      const html = render({ bandClassName: band })

      expect(html).toContain(`<header class="pointer-events-auto ${band}"`)
      expect(classOf(html, '<nav')).toContain(band)
    })

    it('gives way to full-bleed once the nav sticks', () => {
      const nav = classOf(render({ bandClassName: band, condensed: true }), '<nav').split(' ')

      expect(nav).toContain('full-bleed')
      expect(nav).not.toContain('max-w-7xl')
    })

    it('leaves the banner and the bar their own clicks', () => {
      // LayoutChrome's lead-splash overlay spans the page, so the sticky nav
      // inside it can travel; `pointer-events-none` there hands the content
      // below its clicks back, and these two take theirs.
      const html = render()

      expect(html).toContain('<header class="pointer-events-auto"')
      expect(classOf(html, '<nav').split(' ')).toContain('pointer-events-auto')
    })
  })

  describe('surface', () => {
    // The banner overlays the lead splash, so it takes the splash's surface
    // from `LayoutChrome`'s band rather than claiming one (#133).
    it('claims no surface of its own until the nav sticks', () => {
      const html = render()

      expect(html).not.toContain('surface-')
      expect(html).toContain('text-fg-muted')
    })

    it('turns the sticky nav light, since it paints itself white', () => {
      const nav = classOf(render({ condensed: true }), '<nav').split(' ')

      expect(nav).toContain('surface-light')
      expect(nav).toContain('bg-white')
    })
  })
})
