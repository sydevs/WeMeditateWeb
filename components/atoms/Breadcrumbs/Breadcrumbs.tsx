import { ComponentProps } from 'react'
import { Link } from '../Link'
import { useT } from '../../../hooks/useT'

export interface BreadcrumbItem {
  /** Label to display for the breadcrumb */
  label: string
  /** URL to link to (if undefined, renders as plain text for current page) */
  href?: string
}

export interface BreadcrumbsProps extends Omit<ComponentProps<'nav'>, 'children'> {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[]
}

/**
 * Breadcrumbs navigation component for showing hierarchical page location.
 * Automatically styles the last item (current page) differently.
 */
export function Breadcrumbs({
  items,
  className = '',
  ...props
}: BreadcrumbsProps) {
  const t = useT()

  if (!items || items.length === 0) {
    return null
  }

  return (
    <nav
      aria-label={t('common.a11y.breadcrumb')}
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
                  variant="primary"
                  size="inherit"
                  className="no-underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-fg">{item.label}</span>
              )}

              {!isLast && (
                <span className="text-line font-bold" aria-hidden="true">
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
