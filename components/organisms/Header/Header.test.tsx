import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Header } from './Header'
import { anchorFor, classesWith, classFor, classOf, openTag } from '../../../tests/_helpers/markup'

const navItems = [{ label: 'Meditate Now', href: '/meditate' }]

const render = (props: Partial<React.ComponentProps<typeof Header>> = {}) =>
  renderToStaticMarkup(
    <Header
      actionLinkHref="/classes"
      actionLinkText="Classes near me"
      navItems={navItems}
      {...props}
    />,
  )

const navClasses = (html: string) => classOf(html, '<nav').split(' ')

/** The compact bar's markup, from its `<nav>` on, without the banner. */
const barOf = (html: string) => html.slice(html.indexOf('<nav'))

describe('Header', () => {
  it('renders the full banner by default', () => {
    const html = render()

    // The banner carries the decorative illustration. The condensed bar does not.
    expect(html).toContain('<svg')
    expect(html).toContain('>Classes near me<')
    expect(html).toContain('Meditate Now')
  })

  describe('the banner', () => {
    it('keeps the banner landmark a phone would otherwise have none of', () => {
      // `<nav>` cannot carry `banner` beside its own role, and #204 rules out a
      // wrapper above it, so the element stays and only its band is hidden.
      expect(classOf(render(), '<header').split(' ')).not.toContain('max-lg:hidden')
    })

    it('hides its band below `lg:`, so a phone starts on the compact bar', () => {
      expect(render()).toContain('<div class="max-lg:hidden flex items-center')
    })

    it('words the action link on one line, beside a pin', () => {
      expect(anchorFor(render(), '/classes')).toContain('whitespace-nowrap')
    })
  })

  describe('condensed', () => {
    it('drops the banner but keeps the nav', () => {
      // `/map` gives the viewport to the atlas, so the tall banner is chrome the
      // page has no room for — the compact nav carries the logo and action link.
      const count = (html: string) => html.split('Classes near me').length - 1

      // The banner's action link and the bar's pin each word it once.
      expect(count(render())).toBe(2)
      expect(count(render({ condensed: true }))).toBe(1)
      expect(render({ condensed: true })).toContain('Meditate Now')
    })

    it('pins the nav in the state it otherwise animates into on scroll', () => {
      // Server-rendered, so this is the first-paint state: no observer has run.
      // Without `condensed` the nav starts un-sticky and the logo is hidden.
      const condensed = render({ condensed: true })
      const normal = render()

      // `lg:invisible` is the hidden state the compact logo and map-pin carry
      // until the nav sticks, and nothing else in the header carries it.
      expect(condensed).toContain('bg-white')
      expect(classesWith(condensed, 'lg:invisible')).toHaveLength(0)
      expect(classesWith(normal, 'lg:invisible')).toHaveLength(2)
    })

    it('keeps the bar for a phone, and only for a phone, when there are no nav items', () => {
      // Below `lg:` the bar is the whole header, so a config missing its nav
      // groups must still leave a phone the logo and the action link.
      const html = render({ condensed: true, navItems: [] })

      expect(navClasses(html)).toContain('lg:hidden')
      expect(anchorFor(barOf(html), '/')).not.toBe('')
      expect(anchorFor(barOf(html), '/classes')).not.toBe('')
      expect(navClasses(render())).not.toContain('lg:hidden')
    })
  })

  describe('the sticky nav row', () => {
    it('renders only at lg and above', () => {
      const row = classFor(render(), 'items-stretch').split(' ')

      expect(row).toContain('hidden')
      expect(row).toContain('lg:flex')
    })

    it('centres the links on the page whatever the two sides hold', () => {
      // Stuck, the wordmark on the left is wider than the pin on the right, so
      // `justify-between` would push the links off centre.
      expect(classFor(render(), 'min-h-14')).toContain('lg:grid-cols-[1fr_auto_1fr]')
    })

    it("restates the band once stuck, so the logo holds the banner logo's edge", () => {
      // Un-stuck, the nav takes the band itself.
      const stuck = classFor(render({ condensed: true }), 'min-h-14')
      const unstuck = classFor(render(), 'min-h-14').split(' ')

      expect(stuck).toContain('max-w-7xl mx-auto px-6')
      expect(unstuck).not.toContain('px-6')
    })

    it('draws its top rule only under the banner', () => {
      // Stuck, it would sit on the viewport's top edge; below `lg:` there is no
      // banner to divide it from.
      const unstuck = navClasses(render())

      expect(unstuck).toContain('lg:border-t')
      expect(unstuck).not.toContain('border-t')
      expect(navClasses(render({ condensed: true }))).not.toContain('lg:border-t')
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
    it('hides its two controls only at lg, and out of the tab order there', () => {
      // Only `lg:` has a banner to carry the logo and action link until the nav
      // sticks. `pointer-events-none` would stop the mouse and nothing else, so
      // a keyboard would reach two invisible named links (SC 2.4.7). `Button`
      // carries a `disabled:pointer-events-none` of its own, so its absence is
      // not assertable here.
      const html = render()

      expect(classesWith(html, 'lg:invisible')).toHaveLength(2)
      expect(classesWith(html, 'invisible')).toHaveLength(0)
      expect(classesWith(html, 'opacity-0')).toHaveLength(0)
    })

    it('grows its two controls to 44x44 rather than hanging an overlay off them', () => {
      // The bar is pinned at `top-0`, so below `lg:` — where the nav row is
      // hidden — the viewport clipped a centred `::before` to 44x31. A grown box
      // cannot be clipped, and it floors the bar from its own content.
      const html = render()

      expect(classFor(html, 'min-h-14')).not.toContain('min-h-11')
      expect(anchorFor(barOf(html), '/')).toContain('touch-target')
      expect(classFor(html, 'lg:justify-end').split(' ')).toContain('touch-target')
      // The menu trigger brings exactly one overlay into the bar, and the bar
      // is still the clipping edge. A second is the #202 shape again.
      expect(classesWith(html, 'touch-target-overlay')).toHaveLength(1)
    })

    it('is drawn before it sticks, because the menu trigger lives in it', () => {
      // The trigger inside it is visible and un-gated, so a bar that hid itself
      // below `lg:` would leave a phone no menu at all until it scrolled past
      // the banner.
      expect(navClasses(render())).not.toContain('hidden')
      expect(navClasses(render({ condensed: true }))).not.toContain('hidden')
    })

    it('carries the menu trigger, un-gated by the sticky state', () => {
      // `compactControl` takes the logo and the pin out of the a11y tree at
      // `lg:` until the nav sticks. The trigger shares none of it, and puts its
      // drawn icon on the gutter as the panel's × does.
      const trigger = openTag(render(), 'button')

      expect(trigger).toContain('aria-label="Menu"')
      expect(trigger).toContain('lg:hidden')
      expect(trigger).toContain('-mr-2.5')
      expect(trigger).not.toContain('invisible')
    })

    it('lands the trigger on the right edge rather than between the two controls', () => {
      // `justify-between` over three space-taking boxes centred it. The logo's
      // auto margin spends that space instead, and the trigger is last in the
      // row, so it holds the edge the map pin takes once stuck.
      const html = render()

      expect(anchorFor(barOf(html), '/')).toContain('max-lg:mr-auto')
      expect(html.indexOf('aria-label="Menu"')).toBeGreaterThan(html.lastIndexOf('href="/classes"'))
    })

    it('names both controls by their own words', () => {
      // The logo by its wordmark, from `common.general.site_title`. An
      // `aria-label` beside visible words is a second name, and axe's
      // label-content-name-mismatch asks for review of every one. The pin
      // takes the class page's own already-translated title, drawn from `xl:`
      // and read by a screen reader at every width.
      const bar = barOf(render())

      expect(anchorFor(bar, '/')).not.toContain('aria-label')
      expect(bar).toContain('>We meditate</span>')
      expect(bar).toContain('<span class="sr-only xl:not-sr-only">Classes near me</span>')
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
      const nav = navClasses(render({ bandClassName: band, condensed: true }))

      expect(nav).toContain('full-bleed')
      expect(nav).not.toContain('max-w-7xl')
    })

    it('leaves the banner and the bar their own clicks', () => {
      // LayoutChrome's lead-splash overlay spans the page, so the sticky nav
      // inside it can travel; `pointer-events-none` there hands the content
      // below its clicks back, and these two take theirs.
      const html = render()

      expect(html).toContain('<header class="pointer-events-auto"')
      expect(navClasses(html)).toContain('pointer-events-auto')
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
      const nav = navClasses(render({ condensed: true }))

      expect(nav).toContain('surface-light')
      expect(nav).toContain('bg-white')
    })
  })
})
