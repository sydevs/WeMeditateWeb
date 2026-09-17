import { describe, it, expect } from 'vitest'
import { lexicalDocumentText, lexicalNodeText } from './lexical-text'

/** A Lexical document holding one paragraph per string. */
function lexical(...paragraphs: string[]) {
  return {
    root: {
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        children: [{ type: 'text', text }],
      })),
    },
  }
}

describe('lexicalNodeText', () => {
  it('concatenates a block’s leaves with no separator by default', () => {
    // This is what a heading anchor id is built from, so a space would change
    // every existing slug.
    const nodes = [
      { type: 'text', text: 'Two ' },
      { type: 'text', text: 'words' },
    ]

    expect(lexicalNodeText(nodes)).toBe('Two words')
  })

  it('recurses into children', () => {
    expect(lexicalNodeText(lexical('Hello').root.children)).toBe('Hello')
  })

  it('returns an empty string for anything that is not a node list', () => {
    expect(lexicalNodeText(undefined)).toBe('')
    expect(lexicalNodeText(null)).toBe('')
    expect(lexicalNodeText('text')).toBe('')
  })
})

describe('lexicalDocumentText', () => {
  it('joins blocks into one line rather than running them together', () => {
    expect(lexicalDocumentText(lexical('Para one.', 'Para two.'))).toBe('Para one. Para two.')
  })

  it('returns undefined for an empty, blank or missing document', () => {
    expect(lexicalDocumentText(null)).toBeUndefined()
    expect(lexicalDocumentText(undefined)).toBeUndefined()
    expect(lexicalDocumentText(lexical('   '))).toBeUndefined()
    expect(lexicalDocumentText({ root: { children: [] } })).toBeUndefined()
  })
})
