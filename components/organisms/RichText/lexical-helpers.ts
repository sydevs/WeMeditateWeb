/**
 * Pure helpers for the RichText renderer. Kept free of JSX so they can be unit
 * tested directly and reused by the Lexical → React converters.
 */

import { documentHref, type RelationValue } from '../../../lib/document-routes'
import { isPopulated } from '../../../lib/payload-relationships'
import type { Image, Page } from '../../../server/sahajcloud-types'

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
interface PageCard {
  title: string
  description: string
  href: string
  image: { url: string; alt: string; width?: number | null; height?: number | null }
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

  if (!isPopulated<Partial<Page>>(page)) {
    return null
  }
  const title = typeof page.title === 'string' ? page.title.trim() : ''
  const description = typeof page.meta?.description === 'string' ? page.meta.description.trim() : ''
  const image = page.meta?.image
  const href = documentHref('pages', page as RelationValue)

  if (!title || !description || !href || !isPopulated<Partial<Image>>(image)) {
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

/** A paragraph with no text, which Lexical routinely leaves beside a decorator node. */
function isBlankParagraph(node: unknown): boolean {
  return (
    isPopulated<{ type?: unknown; children?: unknown }>(node) &&
    node.type === 'paragraph' &&
    !getNodeText(node.children).trim()
  )
}

/**
 * Where the card at `index` sits among the cards on either side of it: its
 * 1-based `position` and the run's `length`. Any other sibling ends the run,
 * so a list separated by a paragraph numbers from one again — except a blank
 * paragraph, which draws no visible break between two cards.
 */
export function cardRun(siblings: readonly unknown[], index: number): CardRun {
  let position = 1
  let length = 1

  for (let i = index - 1; i >= 0; i--) {
    if (pageCard(siblings[i])) {
      position++
      length++
    } else if (!isBlankParagraph(siblings[i])) {
      break
    }
  }
  for (let i = index + 1; i < siblings.length; i++) {
    if (pageCard(siblings[i])) {
      length++
    } else if (!isBlankParagraph(siblings[i])) {
      break
    }
  }

  return { position, length }
}

export type SubheadingLevel = 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

/**
 * The tag a `heading` node renders as. Anything outside h2-h6 — an `h1`, or a
 * node carrying no tag — draws an `h2`, so a heading in the body never
 * competes with the page title.
 */
export function headingTag(node: unknown): SubheadingLevel {
  const tag = isPopulated<{ tag?: unknown }>(node) ? node.tag : undefined

  return typeof tag === 'string' && /^h[2-6]$/.test(tag) ? (tag as SubheadingLevel) : 'h2'
}

/**
 * The heading level for a card at `index`: one below the nearest heading
 * before it, `h2` when none does, so a card never skips a level under the
 * page's `h1`.
 */
export function cardHeadingLevel(siblings: readonly unknown[], index: number): SubheadingLevel {
  for (let i = index - 1; i >= 0; i--) {
    const node = siblings[i]

    if (!isPopulated<{ type?: unknown }>(node) || node.type !== 'heading') {
      continue
    }
    const level = Number(headingTag(node).slice(1))

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
