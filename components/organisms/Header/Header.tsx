import { ComponentProps, useState, useEffect, useRef } from 'react'
import { MapPinIcon } from '@heroicons/react/24/outline'
import { Link, Breadcrumbs, BreadcrumbItem, Logo, Button, Icon } from '../../atoms'
import { HeaderIllustrationSvg } from '../../atoms/graphics/svgs'
import { HeaderNavDropdown } from './HeaderNavDropdown'
import type { HeaderDropdownProps } from '../HeaderDropdown'

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
  condensed = false,
  className = '',
  ...props
}: HeaderProps) {
  const [isScrolledPast, setIsScrolledPast] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // `condensed` is the same visual state the scroll observer produces, so it
  // short-circuits rather than duplicating the styling below.
  const isSticky = condensed || isScrolledPast

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
      <header className={className} {...props}>
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
          // header was overlaid on.
          className={`sticky top-0 z-50 border-t border-b border-line-subtle text-fg-muted transition-colors duration-200 ${
            isSticky ? 'surface-light full-bleed bg-white' : ''
          }`}
        >
          {/* Centered content container */}
          <div className="flex items-center justify-between gap-2 max-w-5xl mx-auto px-6">
            {/* Logo - only visible when sticky */}
            <Logo
              className={`shrink-0 transition-opacity duration-200 ${
                isSticky ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              href={logoHref}
              size="sm"
              variant="icon"
            />

            {/* Navigation buttons. Desktop-only, like the banner rows above:
                each item is `basis-1/4` and its label does not wrap, so the row
                cannot shrink below the labels' min-content width (~553px). It
                sits outside any `overflow` container, so below `lg:` it pushed
                the whole document sideways rather than clipping (#202). */}
            <div className="hidden lg:flex items-stretch justify-center gap-2 max-w-3xl flex-1">
              {navItems.map((item, index) =>
                item.dropdown ? (
                  <HeaderNavDropdown
                    key={index}
                    className="basis-1/4"
                    dropdown={item.dropdown}
                    label={item.label}
                  />
                ) : (
                  <Button
                    key={index}
                    className="px-0 basis-1/4"
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

            {/* Map pin icon - only visible when sticky and action link exists */}
            {actionLinkText && actionLinkHref && (
              <div
                className={`shrink-0 transition-opacity duration-200 ${
                  isSticky ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <Link
                  className="flex items-center gap-1 no-underline hover:opacity-75 transition-opacity"
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
