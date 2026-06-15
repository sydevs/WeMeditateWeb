import { Link } from '../../../atoms'
import { slugify } from '../../../../lib/slugify'
import type { TocHeading } from '../../../../lib/cms-blocks'

export interface TableOfContentsProps {
  /** Optional heading shown above the list (e.g. "In this article"). */
  title?: string
  /** Enabled headings, in document order, as stored by the CMS block. */
  headings: TocHeading[]
  /** Additional CSS classes. */
  className?: string
}

/** Indentation per heading-level step below the shallowest heading present. */
const INDENT_CLASSES = ['pl-0', 'pl-4', 'pl-8', 'pl-12'] as const

/**
 * Renders the `table-of-contents` block as anchor links to the page's headings.
 *
 * Anchors are derived with the same `slugify` the RichText heading converter
 * uses, so they always match the `id` emitted on each heading (the stored
 * `slug` may differ if the CMS uses a different slugifier). Headings are
 * indented by their level relative to the shallowest one in the list.
 */
export function TableOfContents({ title, headings, className = '' }: TableOfContentsProps) {
  const valid = headings.filter((h) => h.text?.trim())

  if (valid.length === 0) {
    return null
  }
  const minLevel = Math.min(...valid.map((h) => h.level))

  return (
    <nav
      aria-label={title || 'Table of contents'}
      className={`not-prose my-8 rounded-lg border border-gray-200 bg-gray-50 p-6 ${className}`}
    >
      {title && (
        <p className="mb-3 text-sm font-semibold tracking-wide text-gray-700 uppercase">{title}</p>
      )}

      <ul className="flex flex-col gap-2">
        {valid.map((heading, index) => {
          const anchor = slugify(heading.text)
          const offset = Math.min(heading.level - minLevel, INDENT_CLASSES.length - 1)

          return (
            <li key={`${anchor}-${index}`} className={INDENT_CLASSES[offset]}>
              <Link className="no-underline hover:underline" href={`#${anchor}`} variant="primary">
                {heading.text}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
