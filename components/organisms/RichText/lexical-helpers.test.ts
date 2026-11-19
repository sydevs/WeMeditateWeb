import { describe, it, expect } from 'vitest'
import { cardHeadingLevel, cardRun, pageCard } from './lexical-helpers'

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

describe('cardRun', () => {
  it('places a card within the cards on either side of it', () => {
    const siblings = [para, card, card, card, para]

    expect(cardRun(siblings, 1)).toEqual({ position: 1, length: 3 })
    expect(cardRun(siblings, 3)).toEqual({ position: 3, length: 3 })
  })

  it('starts a new run after anything that is not a card', () => {
    const words = { type: 'paragraph', children: [{ type: 'text', text: 'Between' }] }
    const siblings = [card, card, words, card]

    expect(cardRun(siblings, 1)).toEqual({ position: 2, length: 2 })
    expect(cardRun(siblings, 3)).toEqual({ position: 1, length: 1 })
  })

  it('runs on across a blank paragraph between two cards', () => {
    const breakOnly = { type: 'paragraph', children: [{ type: 'linebreak' }] }

    expect(cardRun([card, para, card], 2)).toEqual({ position: 2, length: 2 })
    expect(cardRun([card, breakOnly, card, para], 0)).toEqual({ position: 1, length: 2 })
  })
})

describe('cardHeadingLevel', () => {
  const heading = (tag: string) => ({ type: 'heading', tag, children: [] })

  it('is h2 with no heading before the card', () => {
    expect(cardHeadingLevel([para, card], 1)).toBe('h2')
  })

  it('is one below the nearest heading before the card', () => {
    expect(cardHeadingLevel([heading('h3'), heading('h2'), para, card], 3)).toBe('h3')
    expect(cardHeadingLevel([heading('h2'), heading('h3'), card], 2)).toBe('h4')
  })

  it('ignores a heading after the card, and reads an h1 node as the h2 it renders as', () => {
    expect(cardHeadingLevel([card, heading('h2')], 0)).toBe('h2')
    expect(cardHeadingLevel([heading('h1'), card], 1)).toBe('h3')
  })

  it('stops at h6', () => {
    expect(cardHeadingLevel([heading('h6'), card], 1)).toBe('h6')
  })
})
