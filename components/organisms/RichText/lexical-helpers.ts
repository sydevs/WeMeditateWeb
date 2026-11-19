/**
 * Pure helpers for the RichText renderer. Kept free of JSX so they can be unit
 * tested directly and reused by the Lexical → React converters.
 */

import { documentHref, type RelationValue } from '../../../lib/document-routes'
import { isPopulated } from '../../../lib/payload-relationships'

// Re-exported so existing importers (`./lexical-helpers`) keep working; the
// heading converter and the `table-of-contents` block share this one
// implementation so anchors and heading ids never drift apart.
export { slugify } from '../../../lib/slugify'

/** One Lexical node, as far as text extraction cares. */
interface TextualNode {
  text?: unknown
  children?: unknown
}

/**
 * The plain text of a list of Lexical nodes, concatenated.
 *
 * The heading converter builds an anchor id from one block's leaves and never
 * receives the raw text, so nothing is inserted between them.
 */
export function getNodeText(nodes: unknown): string {
  if (!Array.isArray(nodes)) {
    return ''
  }

  return nodes
    .map((node) => {
      if (!isPopulated<TextualNode>(node)) {
        return ''
      }
      if (typeof node.text === 'string') {
        return node.text
      }

      return getNodeText(node.children)
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

/** What a card for an embedded page draws, read off its relationship node. */
export interface PageCard {
  title: string
  description: string
  href: string
  image: { url: string; alt: string; width?: number | null; height?: number | null }
}

interface EmbeddedPage {
  title?: unknown
  meta?: {
    description?: unknown
    image?: unknown
  } | null
}

interface EmbeddedImage {
  url?: unknown
  alt?: unknown
  width?: number | null
  height?: number | null
}

/**
 * The card a `relationship` node to a page draws, or null when it draws a
 * link instead.
 *
 * A card needs the page's title, `meta.description` and `meta.image` — what
 * the legacy /techniques list showed for each treatment. A page missing any
 * of them, or one that came back as a bare id, stays the inline link.
 */
export function pageCard(node: unknown): PageCard | null {
  if (
    !isPopulated<{ relationTo?: unknown; value?: unknown }>(node) ||
    node.relationTo !== 'pages'
  ) {
    return null
  }
  const page = node.value

  if (!isPopulated<EmbeddedPage>(page)) {
    return null
  }
  const title = typeof page.title === 'string' ? page.title.trim() : ''
  const description = typeof page.meta?.description === 'string' ? page.meta.description.trim() : ''
  const image = page.meta?.image
  const href = documentHref('pages', page as RelationValue)

  if (!title || !description || !href || !isPopulated<EmbeddedImage>(image)) {
    return null
  }
  if (typeof image.url !== 'string' || !image.url) {
    return null
  }

  return {
    title,
    description,
    href,
    image: {
      url: image.url,
      alt: typeof image.alt === 'string' ? image.alt : '',
      width: image.width,
      height: image.height,
    },
  }
}

interface CardRun {
  position: number
  length: number
}

/**
 * Where the card at `index` sits among the cards on either side of it: its
 * 1-based `position` and the run's `length`. Any sibling that is not a card
 * ends the run, so a list separated by a paragraph numbers from one again.
 */
export function cardRun(siblings: readonly unknown[], index: number): CardRun {
  let start = index
  let end = index

  while (start > 0 && pageCard(siblings[start - 1])) {
    start--
  }
  while (end < siblings.length - 1 && pageCard(siblings[end + 1])) {
    end++
  }

  return { position: index - start + 1, length: end - start + 1 }
}

type SubheadingLevel = 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

/**
 * The heading level for a card at `index`: one below the nearest heading
 * before it, `h2` when none does, so a card never skips a level under the
 * page's `h1`. An `h1` node counts as the `h2` the heading converter draws.
 */
export function cardHeadingLevel(siblings: readonly unknown[], index: number): SubheadingLevel {
  for (let i = index - 1; i >= 0; i--) {
    const node = siblings[i]

    if (!isPopulated<{ type?: unknown; tag?: unknown }>(node) || node.type !== 'heading') {
      continue
    }
    const level = typeof node.tag === 'string' ? Number(/^h([2-6])$/.exec(node.tag)?.[1] ?? 2) : 2

    return `h${Math.min(level + 1, 6)}` as SubheadingLevel
  }

  return 'h2'
}

/**
 * Tailwind classes for an upload `<figure>`, given its SahajCloud alignment. An
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
