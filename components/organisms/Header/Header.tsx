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
  /** Color variant - light for dark backgrounds, dark for light backgrounds */
  variant?: 'light' | 'dark'
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
  variant = 'dark',
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

  // Text color based on variant and sticky state
  const textColorClass = variant === 'light' ? 'text-white' : 'text-gray-700'

  // Border color should match text color (except when sticky)
  const borderColorClass = variant === 'light' ? 'border-white' : 'border-gray-200'

  return (
    <>
      <header
        className={className}
        {...props}
      >
        {/* Top banner with logo, illustration, and action link */}
        <div className={`flex items-center justify-between gap-8 py-4 ${textColorClass}`}>
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
              variant="unstyled"
              size="sm"
              className="no-underline leading-none hover:opacity-75 transition-opacity"
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
          className={`sticky top-0 z-50 border-t border-b transition-colors duration-200 ${
            isSticky
              ? 'bg-white border-gray-200 text-gray-700'
              : `${textColorClass} ${borderColorClass}`
          }`}
          style={{
            width: isSticky ? '100vw' : 'auto',
            marginLeft: isSticky ? 'calc(-50vw + 50%)' : '0',
            marginRight: isSticky ? 'calc(-50vw + 50%)' : '0',
          }}
        >
          {/* Centered content container */}
          <div className="flex items-center justify-between gap-2 max-w-5xl mx-auto px-6">
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
                  variant={isSticky ? 'ghost' : variant === 'light' ? 'ghost-light' : 'ghost'}
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
                <Link href={actionLinkHref} variant="unstyled" className="flex items-center gap-1 no-underline hover:opacity-75 transition-opacity">
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
          <Breadcrumbs items={breadcrumbs} variant={variant} />
        </div>
      )}
    </>
  )
}
