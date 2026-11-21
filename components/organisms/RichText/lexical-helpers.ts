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
 * A card is a page the editor tagged `technique`, with the title,
 * `meta.description` and `meta.image` the legacy /techniques list showed for
 * each treatment. Every other page embed — a see-also link that happens to
 * carry a meta image — stays the inline link, so filling a field in
 * SahajCloud never turns one into a card the editor cannot ask back.
 */
export function pageCard(node: unknown): PageCard | null {
  if (
    !isPopulated<{ relationTo?: unknown; value?: unknown }>(node) ||
    node.relationTo !== 'pages'
  ) {
    return null
  }
  const page = node.value

  if (!isPopulated<Partial<Page>>(page) || !page.tags?.includes('technique')) {
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

/** Everything a card reads off the siblings around it. */
interface CardPlacement {
  /** 1-based place in its run of consecutive cards, which decides the side it draws on. */
  position: number
  /** Whether the run holds more than this card, so a sequence number means something. */
  numbered: boolean
  /** One level below the nearest heading before the card, `h2` under none. */
  headingLevel: SubheadingLevel
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
 * Where the card at `index` sits among its siblings.
 *
 * Any sibling but a card ends the run, so a list broken by a paragraph numbers
 * from one again and alternates from the left again — except a blank
 * paragraph, which draws no visible break between two cards. The heading walk
 * continues past the end of the run, because the heading a card sits under is
 * not often the sibling next to it.
 */
export function cardPlacement(siblings: readonly unknown[], index: number): CardPlacement {
  let position = 1
  let numbered = false
  let headingLevel: SubheadingLevel = 'h2'
  let inRun = true

  for (let i = index - 1; i >= 0; i--) {
    const node = siblings[i]

    if (inRun && pageCard(node)) {
      position++
      numbered = true
      continue
    }
    if (isPopulated<{ type?: unknown }>(node) && node.type === 'heading') {
      headingLevel = `h${Math.min(Number(headingTag(node).slice(1)) + 1, 6)}` as SubheadingLevel
      break
    }
    if (!isBlankParagraph(node)) {
      inRun = false
    }
  }
  for (let i = index + 1; !numbered && i < siblings.length; i++) {
    if (pageCard(siblings[i])) {
      numbered = true
    } else if (!isBlankParagraph(siblings[i])) {
      break
    }
  }

  return { position, numbered, headingLevel }
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
