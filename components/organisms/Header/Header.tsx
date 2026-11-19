import { ComponentProps, useState, useEffect, useRef } from 'react'
import { MapPinIcon } from '@heroicons/react/24/outline'
import { Link, Breadcrumbs, BreadcrumbItem, Logo, Button, Icon } from '../../atoms'
import { HeaderIllustrationSvg } from '../../atoms/graphics/svgs'
import { HeaderNavDropdown } from './HeaderNavDropdown'
import { MobileMenu, type MobileMenuProps } from '../MobileMenu'
import type { HeaderDropdownProps } from '../HeaderDropdown'
import { barRow, trailingIconInset } from './bar'
import { useT } from '../../../hooks/useT'

/**
 * A single top-level nav entry. An item with a `dropdown` renders as a
 * link-less hover-or-click mega-menu (HeaderNavDropdown) instead of a flat
 * link. Such items omit `href`. Plain link items provide `href`. `active`
 * marks the current page's link, with a persistent tint and
 * `aria-current="page"`. It applies only to plain link items.
 */
export interface NavItem {
  label: string
  href?: string
  active?: boolean
  dropdown?: HeaderDropdownProps
}

/**
 * `LayoutChrome` overlays the header on a lead splash with a box that spans the
 * whole page — which is what lets the sticky nav below travel it (#204) — and
 * disowns its clicks so the content underneath keeps them. The header's own
 * elements take theirs back.
 */
const clickable = 'pointer-events-auto'

/** The action link, worded in the banner and a pin in the bar. */
const actionLink =
  'flex touch-target items-center gap-2 whitespace-nowrap font-medium no-underline hover:opacity-75 transition-opacity'

export interface HeaderProps
  extends
    Omit<ComponentProps<'header'>, 'children'>,
    Pick<MobileMenuProps, 'languages' | 'socialLinks'> {
  /** Logo href (default: "/") */
  logoHref?: string
  /** Action link text, for example "Classes near me" */
  actionLinkText?: string
  /** Action link href */
  actionLinkHref?: string
  /** Main navigation menu items. */
  navItems?: NavItem[]
  /** Breadcrumb navigation items */
  breadcrumbs?: BreadcrumbItem[]
  /**
   * The page band — max width and gutter — for the banner and the un-stuck nav.
   *
   * It arrives as classes rather than a wrapper because the nav below is
   * `position: sticky`: a wrapper would be its containing block, and the nav
   * would stop pinning one header-height down the page (#204).
   */
  bandClassName?: string
  /**
   * Render the condensed header permanently, rather than only once the page has
   * been scrolled past the banner.
   *
   * Drops the tall banner (logo, illustration, action link) and pins the nav in
   * the compact state it otherwise animates into. For a page that owns the
   * viewport — the atlas at `/map` — the banner is chrome the page has no room
   * to give away.
   * @default false
   */
  condensed?: boolean
}

/**
 * Page header organism with logo, navigation, action link, and breadcrumbs.
 * Based on wemeditate.com header design.
 *
 * At `lg:` a tall banner (logo, illustration, action link) sits over the nav
 * row, and once the row sticks it takes the logo and action link itself.
 * Below `lg:` there is no banner: the compact bar is the header in every
 * state, transparent at the top of the page and white once scrolled.
 */
export function Header({
  logoHref = '/',
  actionLinkText,
  actionLinkHref,
  navItems = [],
  breadcrumbs,
  bandClassName = '',
  condensed = false,
  languages,
  socialLinks,
  className = '',
  ...props
}: HeaderProps) {
  const [isScrolledPast, setIsScrolledPast] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const t = useT()

  // `condensed` is the same visual state the scroll observer produces, so it
  // short-circuits rather than duplicating the styling below.
  const isSticky = condensed || isScrolledPast

  // The bar's logo and action link, which at `lg:` the banner carries until the
  // nav sticks. Below `lg:` there is no banner, so they show in every state.
  // `invisible` is what keeps them out of the tab order and the a11y tree
  // meanwhile — `pointer-events-none` stops only the mouse, so at `lg:` un-stuck
  // a keyboard reached two named links nobody can see (SC 2.4.7). Each carries
  // its own `transition-opacity`, so they fade in and hide at once.
  const compactControl = `duration-200 ${isSticky ? '' : 'lg:opacity-0 lg:invisible'}`

  useEffect(() => {
    const sentinel = sentinelRef.current

    // Nothing to observe when the condensed state is already pinned on.
    if (!sentinel || condensed) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel goes out of view (scrolled past), nav becomes sticky
        setIsScrolledPast(!entry.isIntersecting)
      },
      { threshold: [0] },
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [condensed])

  return (
    <>
      {/* Desktop-only: below `lg:` the compact bar is the whole header, and a
          banner over it would push the page 80px down for a logo the bar
          already shows. */}
      <header
        className={['max-lg:hidden', clickable, bandClassName, className].filter(Boolean).join(' ')}
        {...props}
      >
        {/* Top banner with logo, illustration, and action link. Omitted when
            condensed — the compact nav below carries the logo and action link
            itself, so rendering both would duplicate them. */}
        {!condensed && (
          <div className="flex items-center justify-between gap-8 py-4 text-fg-muted">
            <Logo align="left" className="shrink-0" href={logoHref} size="sm" variant="text" />

            <div className="flex-1 mx-8">
              <HeaderIllustrationSvg />
            </div>

            {actionLinkText && actionLinkHref && (
              <Link
                className={`shrink-0 ${actionLink}`}
                href={actionLinkHref}
                size="sm"
                variant="unstyled"
              >
                <Icon icon={MapPinIcon} size="sm" />
                {actionLinkText}
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Sentinel element to detect when nav should be sticky */}
      {!condensed && <div ref={sentinelRef} aria-hidden="true" className="h-0" />}

      {/* Main navigation menu - sticky on scroll (outside header so it can stick globally) */}
      <nav
        aria-label={t('common.a11y.primary_navigation')}
        // Once stuck, the nav paints its own white surface over whatever the
        // header was overlaid on. Un-stuck it takes the layout's page band,
        // which a wrapper cannot give it: see `bandClassName`. The top rule
        // only ever divides it from the banner, so it is drawn neither below
        // `lg:` nor once stuck, where it would sit on the viewport's top edge.
        //
        // Drawn with no nav items too: below `lg:` it is the whole header, so
        // a SahajCloud config missing its nav groups would leave a phone no
        // logo and no way home. At `lg:` the banner carries both.
        className={`sticky top-0 z-50 ${clickable} border-b border-line-subtle text-fg-muted transition-colors duration-200 ${
          isSticky ? 'surface-light full-bleed bg-white' : `lg:border-t ${bandClassName}`
        } ${navItems.length > 0 ? '' : 'lg:hidden'}`}
      >
        {/* Stuck, the row restates the band's width and gutter, so the logo
              holds the edge the banner's logo had rather than jumping inward
              at the moment of sticking.

              A grid at `lg:`, so the links centre on the page whatever the two
              sides hold. */}
        <div
          className={`${barRow} gap-2 lg:grid lg:grid-cols-[1fr_auto_1fr] ${
            isSticky ? 'max-w-7xl mx-auto px-6' : ''
          }`}
        >
          {/* Growing the box to 44×44 beats hanging an overlay off the icon:
                the bar is pinned at `top-0`, so the viewport clipped a centred
                `::before` to 44×31 (#202).

                `max-lg:mr-auto` eats the free space, which groups the controls
                after it on the right edge. The wordmark names the link: an
                `aria-label` beside it would be a second name to keep in step
                (SC 2.5.3). */}
          <Logo
            className={`shrink-0 max-lg:mr-auto lg:justify-self-start ${compactControl}`}
            href={logoHref}
            size="lg"
            variant="inline"
          />

          {/* Navigation buttons. Desktop-only: the labels do not wrap, so the row
                cannot shrink below their min-content width, and nothing in
                `LayoutChrome` clips it — below `lg:` it pushed the document
                sideways (#202).

                Each item is sized by its own label. `basis-1/4` forced four
                equal columns against a list `useSiteNav` builds from
                `featuredPages`, so a fifth entry wrapped every label. */}
          <div className="hidden lg:flex items-stretch justify-center gap-2">
            {navItems.map((item, index) =>
              item.dropdown ? (
                <HeaderNavDropdown
                  // eslint-disable-next-line @eslint-react/no-array-index-key -- a nav item holds no state, so reusing one across an editor's reorder costs a prop diff and nothing else
                  key={index}
                  dropdown={item.dropdown}
                  label={item.label}
                />
              ) : (
                <Button
                  // eslint-disable-next-line @eslint-react/no-array-index-key -- a nav item holds no state, so reusing one across an editor's reorder costs a prop diff and nothing else
                  key={index}
                  href={item.href}
                  isActive={item.active}
                  size="sm"
                  variant="ghost"
                >
                  {item.label}
                </Button>
              ),
            )}
          </div>

          {/* At `lg:` the pin is last, and `justify-end` puts its drawn icon on
                the gutter, level with the logo opposite. */}
          {/* `gap-0.5` keeps the ☰'s 44px overlay, 2px wider than its box
                each side, off the pin's own box (docs/rules/design-system.md). */}
          <div className="flex shrink-0 items-center gap-0.5 lg:justify-self-end">
            {actionLinkText && actionLinkHref && (
              <Link
                className={`justify-center lg:justify-end ${actionLink} ${compactControl}`}
                href={actionLinkHref}
                size="sm"
                variant="unstyled"
              >
                <Icon icon={MapPinIcon} size="md" />
                {/* Worded from `xl:` only. A fifth featured page fills the
                      stuck row at 1024, and a grid that cannot fit its row
                      pushes the document sideways (#202). */}
                <span className="sr-only xl:not-sr-only">{actionLinkText}</span>
              </Link>
            )}

            {/* Un-gated by `compactControl`: the menu must be reachable before
                  the nav sticks. Last in the row, so it holds the right edge,
                  under the thumb. */}
            <MobileMenu
              actionLinkHref={actionLinkHref}
              actionLinkText={actionLinkText}
              className={`lg:hidden ${trailingIconInset}`}
              languages={languages}
              logoHref={logoHref}
              navItems={navItems}
              socialLinks={socialLinks}
            />
          </div>
        </div>
      </nav>

      {/* Breadcrumbs - below nav to preserve correct ordering */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="py-3 text-fg-muted">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      )}
    </>
  )
}
