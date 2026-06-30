import { ComponentProps, useState, useEffect, useRef } from 'react'
import { MapPinIcon } from '@heroicons/react/24/outline'
import { Link, Breadcrumbs, BreadcrumbItem, Logo, Button, Icon } from '../../atoms'
import { HeaderIllustrationSvg } from '../../atoms/graphics/svgs'
import { HeaderNavDropdown } from './HeaderNavDropdown'
import type { HeaderDropdownProps } from '../HeaderDropdown'

export interface HeaderProps extends Omit<ComponentProps<'header'>, 'children'> {
  /** Logo href (default: "/") */
  logoHref?: string
  /** Action link text (e.g., "Classes near me") */
  actionLinkText?: string
  /** Action link href */
  actionLinkHref?: string
  /**
   * Main navigation menu items. An item with a `dropdown` renders as a
   * link-less hover/click mega-menu (HeaderNavDropdown) instead of a flat link;
   * such items omit `href`. Plain link items provide `href`.
   */
  navItems?: Array<{ label: string; href?: string; dropdown?: HeaderDropdownProps }>
  /** Breadcrumb navigation items */
  breadcrumbs?: BreadcrumbItem[]
  /**
   * Theme based on background context
   * - light: Dark colors for light backgrounds (default)
   * - dark: White colors for dark backgrounds
   * @default 'light'
   */
  theme?: 'light' | 'dark'
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
  theme = 'light',
  className = '',
  ...props
}: HeaderProps) {
  const [isSticky, setIsSticky] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current

    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel goes out of view (scrolled past), nav becomes sticky
        setIsSticky(!entry.isIntersecting)
      },
      { threshold: [0] },
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [])

  // Text color based on theme and sticky state
  const textColorClass = theme === 'dark' ? 'text-white' : 'text-gray-700'

  // Border color should match text color (except when sticky)
  const borderColorClass = theme === 'dark' ? 'border-white' : 'border-gray-200'

  return (
    <>
      <header className={className} {...props}>
        {/* Top banner with logo, illustration, and action link */}
        <div className={`flex items-center justify-between gap-8 py-4 ${textColorClass}`}>
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
      </header>

      {/* Sentinel element to detect when nav should be sticky */}
      <div ref={sentinelRef} aria-hidden="true" className="h-0" />

      {/* Main navigation menu - sticky on scroll (outside header so it can stick globally) */}
      {navItems.length > 0 && (
        <nav
          className={`sticky top-0 z-50 border-t border-b transition-colors duration-200 ${
            isSticky
              ? 'full-bleed bg-white border-gray-200 text-gray-700'
              : `${textColorClass} ${borderColorClass}`
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

            {/* Navigation buttons */}
            <div className="flex items-stretch justify-center gap-2 max-w-3xl flex-1">
              {navItems.map((item, index) =>
                item.dropdown ? (
                  <HeaderNavDropdown
                    key={index}
                    className="basis-1/4"
                    dropdown={item.dropdown}
                    label={item.label}
                    theme={isSticky ? 'light' : theme}
                  />
                ) : (
                  <Button
                    key={index}
                    className="px-0 basis-1/4"
                    href={item.href}
                    size="sm"
                    theme={isSticky ? 'light' : theme}
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
        <div className={`py-3 ${textColorClass}`}>
          <Breadcrumbs items={breadcrumbs} theme={theme} />
        </div>
      )}
    </>
  )
}
