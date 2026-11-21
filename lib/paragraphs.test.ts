import { describe, it, expect } from 'vitest'
import { toParagraphs } from './paragraphs'

describe('toParagraphs', () => {
  it('keeps text with no line break as one paragraph, unchanged', () => {
    expect(toParagraphs('One paragraph, with no break at all.')).toEqual([
      'One paragraph, with no break at all.',
    ])
  })

  it('starts a new paragraph at a blank line', () => {
    expect(toParagraphs('First paragraph.\n\nSecond paragraph.')).toEqual([
      'First paragraph.',
      'Second paragraph.',
    ])
  })

  it('starts a new paragraph at a single line break too', () => {
    expect(toParagraphs('First line.\nSecond line.')).toEqual(['First line.', 'Second line.'])
  })

  it('trims each paragraph and drops the empty runs between them', () => {
    // The shape SahajCloud stores: trailing spaces before a break, and a
    // "blank" line holding a space (live on /mooladhara-chakra).
    expect(toParagraphs('  First.  \n \n Second. \r\n\r\nThird.\n')).toEqual([
      'First.',
      'Second.',
      'Third.',
    ])
  })

  it('answers no paragraphs for empty or whitespace-only text', () => {
    expect(toParagraphs('')).toEqual([])
    expect(toParagraphs(' \n\n ')).toEqual([])
  })
})
