import { ComponentProps } from 'react'
import { Link } from '@/components/atoms/Link'
import { useT } from '@/hooks/useT'

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
export function Breadcrumbs({ items, className = '', ...props }: BreadcrumbsProps) {
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
            // eslint-disable-next-line @eslint-react/no-array-index-key -- a trail: a rung is its depth, and the only way the list changes is a new navigation
            <li key={index} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link className="no-underline" href={item.href} size="inherit" variant="primary">
                  {item.label}
                </Link>
              ) : (
                <span className="text-fg">{item.label}</span>
              )}

              {!isLast && (
                <span aria-hidden="true" className="text-line font-bold">
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
