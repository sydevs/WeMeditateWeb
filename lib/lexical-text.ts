/**
 * Plain text out of a Lexical document.
 *
 * One walker, two needs that differ by a single character. The RichText
 * heading converter concatenates one block's leaves to build an anchor id, so
 * it must not introduce a space. An authored form's `message` block and
 * confirmation flatten several blocks into one line, so it must. The
 * separator is therefore an argument rather than a second copy of the walk —
 * the same reason `slugify` lives in `lib/` and `lexical-helpers` re-exports
 * it, so heading ids and anchors cannot drift apart.
 */

import { isPopulated } from './cms-relationships'

/** One Lexical node, as far as text extraction cares. */
interface TextualNode {
  text?: unknown
  children?: unknown
}

/**
 * Recursively collect the plain-text content of a list of Lexical nodes.
 *
 * @param separator - Appended after each container node's text. Defaults to
 *   nothing, which concatenates a single block's leaves.
 */
export function lexicalNodeText(nodes: unknown, separator = ''): string {
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

      return lexicalNodeText(node.children, separator) + separator
    })
    .join('')
}

/**
 * A whole Lexical document as one line of text, or `undefined` when it holds
 * none. Blocks are separated, then runs of whitespace collapse, so a
 * multi-paragraph confirmation reads as a sentence rather than as one word.
 */
export function lexicalDocumentText(
  document: { root?: { children?: unknown[] } } | null | undefined,
): string | undefined {
  const text = lexicalNodeText(document?.root?.children, ' ').replace(/\s+/g, ' ').trim()

  return text.length > 0 ? text : undefined
}
