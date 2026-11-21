/**
 * Which ornament a `textbox` block draws, chosen from where it sits on a page.
 *
 * wemeditate.com hung a line-art triangle, a colour wash or a leaf circle off
 * its text boxes. SahajCloud gives editors no field for them, so the site
 * places them itself, from what an editor can see — the order of the page's
 * text boxes and each one's layout. Never at random, and never from the
 * imported legacy blob (`importData`), which no editor can change.
 *
 * Read the page's text boxes in order, counting only those that render:
 *
 * 1. An "Ancient Wisdom" box (`wisdomStyle` on a side layout) carries its
 *    own floral graphic and takes nothing more.
 * 2. The first text box opens the page: a side box draws the circle behind
 *    its image's inner lower corner, and an overlay draws nothing.
 * 3. After that, a side box decorates its image's outer side, as the old site
 *    did: a triangle hanging off the lower corner when the image is on the
 *    left, a wash down the edge when it is on the right. An overlay hangs a
 *    triangle off the lower corner away from its text.
 * 4. A box whose pick matches the ornament the previous text box drew draws
 *    nothing, so no two neighbours repeat an ornament.
 *
 * Each organism places and sizes its own ornament, and hides it below `lg`.
 */

import { populatedImage } from './content-blocks'
import type { TextBoxBlock } from '../server/payload-types'

export type TextBoxDecoration = 'circle' | 'gradient' | 'triangle'

/** `ornate` is the wisdom box's built-in graphic: it counts as a neighbour. */
type Ornament = TextBoxDecoration | 'ornate' | undefined

function ornamentFor(box: TextBoxBlock, first: boolean): Ornament {
  if (box.imagePosition === 'overlay') {
    return first ? undefined : 'triangle'
  }
  if (box.wisdomStyle) {
    return 'ornate'
  }
  if (first) {
    return 'circle'
  }

  return box.imagePosition === 'left' ? 'triangle' : 'gradient'
}

/** The ornament each of a page's rendered text boxes draws, in page order. */
export function textBoxDecorations(
  boxes: readonly TextBoxBlock[],
): (TextBoxDecoration | undefined)[] {
  let previous: Ornament

  return boxes.map((box, index) => {
    const pick = ornamentFor(box, index === 0)
    const drawn = pick === previous ? undefined : pick

    previous = drawn

    return drawn === 'ornate' ? undefined : drawn
  })
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/** The fields of a `textbox` block node that renders, or `null`. */
function renderedTextBox(node: unknown): TextBoxBlock | null {
  if (!isRecord(node) || node.type !== 'block' || !isRecord(node.fields)) {
    return null
  }
  const fields = node.fields as unknown as TextBoxBlock

  return fields.blockType === 'textbox' && populatedImage(fields.image) ? fields : null
}

/**
 * The ornament the `textbox` block `node` draws among its `parent`'s
 * children. Without a parent to read, it is taken as the page's only box.
 */
export function textBoxDecorationAt(parent: unknown, node: unknown): TextBoxDecoration | undefined {
  const siblings =
    isRecord(parent) && Array.isArray(parent.children) && parent.children.includes(node)
      ? parent.children
      : [node]
  const boxes: TextBoxBlock[] = []
  let index = -1

  for (const sibling of siblings) {
    const fields = renderedTextBox(sibling)

    if (fields) {
      if (sibling === node) {
        index = boxes.length
      }
      boxes.push(fields)
    }
  }

  return index === -1 ? undefined : textBoxDecorations(boxes)[index]
}
