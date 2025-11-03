import { ComponentProps } from 'react'
import { Link } from '../Link'

export interface BreadcrumbItem {
  /** Label to display for the breadcrumb */
  label: string
  /** URL to link to (if undefined, renders as plain text for current page) */
  href?: string
}

export interface BreadcrumbsProps extends Omit<ComponentProps<'nav'>, 'children'> {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[]
  /**
   * Color variant for breadcrumbs
   * - dark: Standard gray/teal colors for light backgrounds
   * - light: White colors for dark backgrounds
   * @default 'dark'
   */
  variant?: 'dark' | 'light'
}

/**
 * Breadcrumbs navigation component for showing hierarchical page location.
 * Automatically styles the last item (current page) differently.
 */
export function Breadcrumbs({
  items,
  variant = 'dark',
  className = '',
  ...props
}: BreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null
  }

  const linkVariant = variant === 'light' ? 'light' : 'primary'
  const currentPageColor = variant === 'light' ? 'text-white' : 'text-gray-900'
  const separatorColor = variant === 'light' ? 'text-white' : 'text-gray-400'

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-2 text-xs ${className}`}
      {...props}
    >
      <ol className="flex items-center gap-2 list-none p-0 m-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  variant={linkVariant}
                  size="inherit"
                  className="no-underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={currentPageColor}>{item.label}</span>
              )}

              {!isLast && (
                <span className={`${separatorColor} font-bold`} aria-hidden="true">
                  ›
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
