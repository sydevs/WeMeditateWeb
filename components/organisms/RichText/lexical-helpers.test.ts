import { describe, it, expect } from 'vitest'
import { cardPlacement, headingTag, pageCard } from './lexical-helpers'

const IMAGE = {
  id: 1,
  url: 'https://imagedelivery.net/acct/img/public',
  alt: 'Art',
  width: 840,
  height: 660,
}

const pageNode = (meta: Record<string, unknown> | null, value: Record<string, unknown> = {}) => ({
  type: 'relationship',
  relationTo: 'pages',
  value: { id: 69, slug: 'footsoaking', title: 'Footsoaking', meta, ...value },
})
const card = pageNode({ description: 'Good for:\nBetter sleep', image: IMAGE })
const para = { type: 'paragraph', children: [] }

describe('pageCard', () => {
  it('reads the title, description, image and route of a populated page', () => {
    expect(pageCard(card)).toEqual({
      title: 'Footsoaking',
      description: 'Good for:\nBetter sleep',
      href: '/footsoaking',
      image: { url: IMAGE.url, alt: 'Art', width: 840, height: 660 },
    })
  })

  it.each([
    ['a bare id', { type: 'relationship', relationTo: 'pages', value: 69 }],
    ['another collection', { ...card, relationTo: 'lectures' }],
    ['no description', pageNode({ description: ' \n ', image: IMAGE })],
    ['no meta at all', pageNode(null)],
    ['an image left as a bare id', pageNode({ description: 'Good for: sleep', image: 462 })],
    ['an image with no url', pageNode({ description: 'Good for: sleep', image: { id: 1 } })],
    ['no slug to link to', pageNode({ description: 'x', image: IMAGE }, { slug: '' })],
    ['no title', pageNode({ description: 'x', image: IMAGE }, { title: '' })],
  ])('answers null for %s', (_, node) => {
    expect(pageCard(node)).toBeNull()
  })
})

describe('cardPlacement', () => {
  const heading = (tag: string) => ({ type: 'heading', tag, children: [] })
  const words = { type: 'paragraph', children: [{ type: 'text', text: 'Between' }] }
  const breakOnly = { type: 'paragraph', children: [{ type: 'linebreak' }] }

  it('places a card within the cards on either side of it', () => {
    const siblings = [para, card, card, card, para]

    expect(cardPlacement(siblings, 1)).toMatchObject({ position: 1, numbered: true })
    expect(cardPlacement(siblings, 3)).toMatchObject({ position: 3, numbered: true })
  })

  it('starts a new run after anything that is not a card', () => {
    const siblings = [card, card, words, card]

    expect(cardPlacement(siblings, 1)).toMatchObject({ position: 2, numbered: true })
    expect(cardPlacement(siblings, 3)).toMatchObject({ position: 1, numbered: false })
  })

  it('leaves a lone card unnumbered', () => {
    expect(cardPlacement([para, card, para], 1)).toMatchObject({ position: 1, numbered: false })
  })

  it('runs on across a blank paragraph between two cards', () => {
    expect(cardPlacement([card, para, card], 2)).toMatchObject({ position: 2, numbered: true })
    expect(cardPlacement([card, breakOnly, card, para], 0)).toMatchObject({
      position: 1,
      numbered: true,
    })
  })

  it('is h2 with no heading before the card', () => {
    expect(cardPlacement([para, card], 1).headingLevel).toBe('h2')
  })

  it('is one below the nearest heading before the card', () => {
    expect(cardPlacement([heading('h3'), heading('h2'), para, card], 3).headingLevel).toBe('h3')
    expect(cardPlacement([heading('h2'), heading('h3'), card], 2).headingLevel).toBe('h4')
  })

  it('ignores a heading after the card, and reads an h1 node as the h2 it renders as', () => {
    expect(cardPlacement([card, heading('h2')], 0).headingLevel).toBe('h2')
    expect(cardPlacement([heading('h1'), card], 1).headingLevel).toBe('h3')
  })

  it('stops at h6', () => {
    expect(cardPlacement([heading('h6'), card], 1).headingLevel).toBe('h6')
  })

  it('finds the heading past the sibling that ended the run', () => {
    expect(cardPlacement([heading('h3'), words, card], 2)).toMatchObject({
      position: 1,
      numbered: false,
      headingLevel: 'h4',
    })
  })

  it('reads a heading inside the cards as both the run end and the level', () => {
    expect(cardPlacement([card, heading('h4'), card], 2)).toMatchObject({
      position: 1,
      numbered: false,
      headingLevel: 'h5',
    })
  })
})

describe('headingTag', () => {
  it('keeps a tag inside h2-h6', () => {
    expect(headingTag({ type: 'heading', tag: 'h4' })).toBe('h4')
  })

  it.each([['h1'], ['h7'], ['div'], ['']])('draws an h2 for %s', (tag) => {
    expect(headingTag({ type: 'heading', tag })).toBe('h2')
  })

  it('draws an h2 for a node with no usable tag', () => {
    expect(headingTag({ type: 'heading' })).toBe('h2')
    expect(headingTag({ type: 'heading', tag: 3 })).toBe('h2')
    expect(headingTag(null)).toBe('h2')
  })
})
