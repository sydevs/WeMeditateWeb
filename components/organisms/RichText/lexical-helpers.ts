/**
 * Pure helpers for the RichText renderer. Kept free of JSX so they can be unit
 * tested directly and reused by the Lexical → React converters.
 */

import { isPopulated } from '../../../lib/cms-relationships'

// Re-exported so existing importers (`./lexical-helpers`) keep working; the
// heading converter and the `table-of-contents` block share this one
// implementation so anchors and heading ids never drift apart.
export { slugify } from '../../../lib/slugify'

/**
 * Recursively collect the plain-text content of a list of Lexical nodes.
 * Used to derive heading anchor ids (the converter only receives rendered React
 * children, not the raw text).
 */
export function getNodeText(nodes: unknown): string {
  if (!Array.isArray(nodes)) {
    return ''
  }

  return nodes
    .map((n) => {
      if (!isPopulated(n)) {
        return ''
      }
      if (typeof n.text === 'string') {
        return n.text
      }
      if (Array.isArray(n.children)) {
        return getNodeText(n.children)
      }

      return ''
    })
    .join('')
}

/**
 * Best-effort human label for an inline relationship target. Returns null for
 * bare ids (unpopulated) so the converter can degrade instead of linking "[12]".
 */
export function relationshipLabel(value: unknown): string | null {
  if (!isPopulated(value)) {
    return null
  }
  for (const candidate of [value.title, value.name, value.slug]) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate
    }
  }

  return null
}

/** Tailwind classes for an upload `<figure>` given its CMS alignment field. */
export function uploadFigureClass(align?: string | null): string {
  switch (align) {
    case 'left':
      return 'my-6 mr-auto text-left'
    case 'right':
      return 'my-6 ml-auto text-right'
    default:
      return 'my-6 mx-auto text-center'
  }
}
