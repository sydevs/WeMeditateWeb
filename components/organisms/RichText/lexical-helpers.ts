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

/**
 * Tailwind classes for an upload `<figure>`, given its CMS alignment. An
 * aligned image takes 40% of the column width: left or right floats so
 * text wraps, and center is a centered block. `wide` breaks out of the
 * article column to span the full content container, through the
 * `full-bleed` utility. Every alignment goes full width on mobile, so
 * small screens stay readable.
 */
export function uploadFigureClass(align?: string | null): string {
  switch (align) {
    case 'wide':
      return 'my-6 full-bleed text-center'
    case 'left':
      return 'my-6 w-full text-left sm:float-left sm:mr-6 sm:w-1/2'
    case 'right':
      return 'my-6 w-full text-right sm:float-right sm:ml-6 sm:w-1/2'
    default: // center
      return 'my-6 mx-auto w-full text-center sm:w-1/2'
  }
}
