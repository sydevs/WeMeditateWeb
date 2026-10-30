import { ComponentProps, useState, useEffect, useRef } from 'react'
import { MapPinIcon } from '@heroicons/react/24/outline'
import { Link, Breadcrumbs, BreadcrumbItem, Logo, Button, Icon } from '../../atoms'
import { HeaderIllustrationSvg } from '../../atoms/graphics/svgs'
import { HeaderNavDropdown } from './HeaderNavDropdown'
import type { HeaderDropdownProps } from '../HeaderDropdown'
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

export interface HeaderProps extends Omit<ComponentProps<'header'>, 'children'> {
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
 * When navigation becomes sticky, it shows a compact logo on the left
 * and a map pin icon on the right for visual context.
 */
export function Header({
  logoHref = '/',
  actionLinkText,
  actionLinkHref,
  navItems = [],
  breadcrumbs,
  bandClassName = '',
  condensed = false,
  className = '',
  ...props
}: HeaderProps) {
  const [isScrolledPast, setIsScrolledPast] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const t = useT()

  // `condensed` is the same visual state the scroll observer produces, so it
  // short-circuits rather than duplicating the styling below.
  const isSticky = condensed || isScrolledPast

  // The compact bar's two icon controls, faded until the nav sticks. `invisible`
  // is what keeps them out of the tab order and the a11y tree meanwhile —
  // `pointer-events-none` stops only the mouse, so at `lg:` un-stuck a keyboard
  // reached two named links nobody can see (SC 2.4.7). They hide at once rather
  // than fading: `Logo`'s own `transition-opacity` wins over a list set here.
  const compactControl = `transition-opacity duration-200 ${
    isSticky ? 'opacity-100' : 'opacity-0 invisible'
  }`

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
      <header className={[clickable, bandClassName, className].filter(Boolean).join(' ')} {...props}>
        {/* Top banner with logo, illustration, and action link. Omitted when
            condensed — the compact nav below carries the logo and action link
            itself, so rendering both would duplicate them. */}
        {!condensed && (
          <div className="flex items-center justify-between gap-8 py-4 text-fg-muted">
            {/* Logo - responsive: lg inline-text on mobile, sm inline-text on desktop */}
            <div className="shrink-0">
              <Logo
                align="left"
                className="hidden lg:flex"
                href={logoHref}
                size="sm"
                variant="text"
              />
            </div>

            {/* Decorative illustration - hidden on mobile */}
            <div className="flex-1 mx-8 hidden lg:block">
              <HeaderIllustrationSvg />
            </div>

            {/* Action link - regular link, not button */}
            {actionLinkText && actionLinkHref && (
              <div className="shrink-0 max-w-20 text-right">
                <Link
                  className="no-underline leading-none hover:opacity-75 transition-opacity"
                  href={actionLinkHref}
                  size="sm"
                  variant="unstyled"
                >
                  {actionLinkText}
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Sentinel element to detect when nav should be sticky */}
      {!condensed && <div ref={sentinelRef} aria-hidden="true" className="h-0" />}

      {/* Main navigation menu - sticky on scroll (outside header so it can stick globally) */}
      {navItems.length > 0 && (
        <nav
          // Once stuck, the nav paints its own white surface over whatever the
          // header was overlaid on. Un-stuck it takes the layout's page band,
          // which a wrapper cannot give it: see `bandClassName`.
          className={`sticky top-0 z-50 ${clickable} border-t border-b border-line-subtle text-fg-muted transition-colors duration-200 ${
            isSticky ? 'surface-light full-bleed bg-white' : `hidden lg:block ${bandClassName}`
          }`}
        >
          <div className="flex items-center justify-between gap-2 max-w-5xl mx-auto px-6">
            {/* Logo - only visible when sticky. Growing the box to 44×44 beats
                hanging an overlay off the 16px icon: the bar is pinned at `top-0`,
                so below `lg:` the viewport clipped a centred `::before` to 44×31
                (#202). The grown box floors the bar from its own content too, and
                `items-center` holds the drawn icon where it was. */}
            <Logo
              aria-label={t('common.general.site_title')}
              className={`shrink-0 touch-target items-center ${compactControl}`}
              href={logoHref}
              size="sm"
              variant="icon"
            />

            {/* Navigation buttons. Desktop-only: the labels do not wrap, so the row
                cannot shrink below their min-content width, and nothing in
                `LayoutChrome` clips it — below `lg:` it pushed the document
                sideways (#202).

                Each item is sized by its own label. `basis-1/4` forced four
                equal columns against a list `useSiteNav` builds from
                `featuredPages`, so a fifth entry wrapped every label and took
                the bar from 46px to 58px at 1024. Content widths fit five on
                one line. */}
            <div className="hidden lg:flex items-stretch justify-center gap-2 max-w-3xl flex-1">
              {navItems.map((item, index) =>
                item.dropdown ? (
                  <HeaderNavDropdown
                    key={index}
                    dropdown={item.dropdown}
                    label={item.label}
                  />
                ) : (
                  <Button
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

            {/* Map pin icon - only visible when sticky and action link exists.
                `justify-end` keeps the drawn pin on the bar's right padding edge
                now that `touch-target` makes its box 44px wide. */}
            {actionLinkText && actionLinkHref && (
              <div className={`shrink-0 ${compactControl}`}>
                <Link
                  aria-label={actionLinkText}
                  className="flex touch-target items-center justify-end gap-1 no-underline hover:opacity-75 transition-opacity"
                  href={actionLinkHref}
                  variant="unstyled"
                >
                  <Icon icon={MapPinIcon} size="sm" />
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Breadcrumbs - below nav to preserve correct ordering */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="py-3 text-fg-muted">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      )}
    </>
  )
}
