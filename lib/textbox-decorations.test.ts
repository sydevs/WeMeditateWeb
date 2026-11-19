import { describe, it, expect } from 'vitest'
import { textBoxDecorationAt, textBoxDecorations } from './textbox-decorations'
import type { TextBoxBlockFields } from './content-blocks'

const IMAGE = { id: 1, url: 'https://imagedelivery.net/acct/img-id/public', alt: '' }

const side = (imagePosition: 'left' | 'right', wisdomStyle = false): TextBoxBlockFields => ({
  image: IMAGE as unknown as TextBoxBlockFields['image'],
  imagePosition,
  wisdomStyle,
})
const overlay = (): TextBoxBlockFields => ({
  image: IMAGE as unknown as TextBoxBlockFields['image'],
  imagePosition: 'overlay',
  textPosition: 'left',
})

const block = (fields: Record<string, unknown>) => ({
  type: 'block',
  version: 2,
  fields: { blockType: 'textbox', ...fields },
})
const paragraph = { type: 'paragraph', version: 1, children: [] }

describe('textBoxDecorations', () => {
  // The live home page's five text boxes, in order.
  it('opens a page with the circle, then decorates by layout', () => {
    expect(
      textBoxDecorations([side('left'), overlay(), side('right'), overlay(), side('left')]),
    ).toEqual(['circle', 'triangle', 'gradient', 'triangle', undefined])
  })

  // The live /shri-mataji: an overlay first, then six side boxes alternating sides.
  it('leaves an opening overlay plain and alternates triangle and wash', () => {
    expect(
      textBoxDecorations([
        overlay(),
        side('left'),
        side('right'),
        side('left'),
        side('right'),
        side('left'),
        side('right'),
      ]),
    ).toEqual([undefined, 'triangle', 'gradient', 'triangle', 'gradient', 'triangle', 'gradient'])
  })

  it('never gives two neighbouring boxes the same ornament', () => {
    expect(textBoxDecorations([side('right'), side('left'), side('left'), side('left')])).toEqual([
      'circle',
      'triangle',
      undefined,
      'triangle',
    ])
  })

  // The chakra pages: an overlay, then the ornate box with its own graphic.
  it('adds nothing to an "Ancient Wisdom" box, which still counts as the opener', () => {
    expect(textBoxDecorations([overlay(), side('right', true)])).toEqual([undefined, undefined])
    expect(textBoxDecorations([side('left', true), side('right')])).toEqual([undefined, 'gradient'])
  })
})

describe('textBoxDecorationAt', () => {
  it('reads the text boxes among the parent’s children, skipping other nodes', () => {
    const first = block({ image: IMAGE, imagePosition: 'left' })
    const second = block({ image: IMAGE, imagePosition: 'right' })
    const parent = { type: 'root', children: [paragraph, first, paragraph, second] }

    expect(textBoxDecorationAt(parent, first)).toBe('circle')
    expect(textBoxDecorationAt(parent, second)).toBe('gradient')
  })

  // An unpublished image leaves a bare id, and the converter renders nothing for it.
  it('skips a text box that does not render', () => {
    const orphan = block({ image: 7, imagePosition: 'left' })
    const box = block({ image: IMAGE, imagePosition: 'left' })
    const parent = { type: 'root', children: [orphan, box] }

    expect(textBoxDecorationAt(parent, box)).toBe('circle')
    expect(textBoxDecorationAt(parent, orphan)).toBeUndefined()
  })

  it('takes a node with no readable parent as the page’s only box', () => {
    expect(textBoxDecorationAt(undefined, block({ image: IMAGE, imagePosition: 'right' }))).toBe(
      'circle',
    )
    expect(textBoxDecorationAt(undefined, block({ image: IMAGE, imagePosition: 'overlay' }))).toBe(
      undefined,
    )
  })
})
