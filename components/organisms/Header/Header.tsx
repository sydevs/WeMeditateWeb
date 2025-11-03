import { ComponentProps, useState, useEffect, useRef } from 'react'
import { MapPinIcon } from '@heroicons/react/24/outline'
import { Link, Breadcrumbs, BreadcrumbItem, Logo, Button, Icon } from '../../atoms'
import { HeaderIllustrationSvg } from '../../atoms/svgs'

export interface HeaderProps extends Omit<ComponentProps<'header'>, 'children'> {
  /** Logo href (default: "/") */
  logoHref?: string
  /** Action link text (e.g., "Classes near me") */
  actionLinkText?: string
  /** Action link href */
  actionLinkHref?: string
  /** Main navigation menu items */
  navItems?: Array<{ label: string; href: string }>
  /** Breadcrumb navigation items */
  breadcrumbs?: BreadcrumbItem[]
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
      { threshold: [0] }
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [])

  return (
    <>
      <header
        className={`bg-white ${className}`}
        {...props}
      >
        {/* Top banner with logo, illustration, and action link */}
        <div className="flex items-center justify-between gap-8 py-4">
        {/* Logo - responsive: lg inline-text on mobile, sm inline-text on desktop */}
        <div className="shrink-0">
          <Logo
            variant="text"
            align="left"
            href={logoHref}
            size="sm"
            className="hidden lg:flex"
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
              href={actionLinkHref}
              variant="neutral"
              size="sm"
              className="no-underline leading-none"
            >
              {actionLinkText}
            </Link>
          </div>
        )}
      </div>
      </header>

      {/* Sentinel element to detect when nav should be sticky */}
      <div ref={sentinelRef} className="h-0" aria-hidden="true" />

      {/* Main navigation menu - sticky on scroll (outside header so it can stick globally) */}
      {navItems.length > 0 && (
        <nav
          className="sticky top-0 z-50 bg-white border-t border-b border-gray-200 transition-shadow duration-200"
        >
          <div className="flex items-center justify-between gap-2 max-w-5xl mx-auto">
            {/* Logo - only visible when sticky */}
            <Logo
              variant="icon"
              href={logoHref}
              size="sm"
              className={`shrink-0 transition-opacity duration-200 ${
                isSticky ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            />

            {/* Navigation buttons */}
            <div className="flex items-stretch justify-center gap-2 max-w-3xl flex-1">
              {navItems.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  href={item.href}
                  className="px-0 basis-1/4"
                >
                  {item.label}
                </Button>
              ))}
            </div>

            {/* Map pin icon - only visible when sticky and action link exists */}
            {actionLinkText && actionLinkHref && (
              <div
                className={`shrink-0 transition-opacity duration-200 ${
                  isSticky ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <Link href={actionLinkHref} variant="neutral" className="flex items-center gap-1 no-underline">
                  <Icon icon={MapPinIcon} size="sm" />
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Breadcrumbs - below nav to preserve correct ordering */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="bg-white py-3">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      )}
    </>
  )
}
