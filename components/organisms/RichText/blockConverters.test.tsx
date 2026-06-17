import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import { blockConverters } from './blockConverters'

// The converter only reads `node.fields`; the other JSXConverter args are
// unused, so narrow to the minimal callable shape this test exercises.
type TextboxConverter = (args: { node: { fields: Record<string, unknown> } }) => ReactElement | null

const textbox = blockConverters.textbox as unknown as TextboxConverter

const IMG = {
  url: 'https://picsum.photos/seed/x/900/1200',
  alt: 'Group class',
  width: 900,
  height: 1200,
}

/** Invoke the `textbox` converter with a minimal lexical node. */
function convertTextbox(fields: Record<string, unknown>) {
  return textbox({ node: { fields: { image: IMG, ...fields } } })
}

function renderTextbox(fields: Record<string, unknown>): string {
  return renderToStaticMarkup(convertTextbox(fields))
}

describe('textbox block converter', () => {
  it('threads the subtitle through to ContentTextBox', () => {
    const html = renderTextbox({ title: 'Get Connected', subtitle: 'Collective meditation' })

    expect(html).toContain('Collective meditation')
  })

  it('maps CMS textColor="light" to white overlay text (theme="dark")', () => {
    const html = renderTextbox({ imagePosition: 'overlay', textColor: 'light', title: 'Hi' })

    expect(html).toContain('text-white')
    expect(html).toContain('text-glow-dark')
  })

  it('maps CMS textColor="dark" to dark overlay text (theme="light")', () => {
    const html = renderTextbox({ imagePosition: 'overlay', textColor: 'dark', title: 'Hi' })

    expect(html).toContain('text-gray-900')
    expect(html).not.toContain('text-white')
  })

  it('applies wisdomStyle on a side (left) layout', () => {
    const html = renderTextbox({ imagePosition: 'left', wisdomStyle: true, title: 'Wisdom' })

    expect(html).toContain('bg-warm')
    expect(html).toContain('<svg')
  })

  it('does not apply wisdomStyle in overlay mode (no parchment)', () => {
    const html = renderTextbox({ imagePosition: 'overlay', wisdomStyle: true, title: 'Wisdom' })

    expect(html).not.toContain('bg-warm')
  })

  it('renders nothing when the image is an unpopulated (bare-id) relationship', () => {
    expect(textbox({ node: { fields: { image: 123, title: 'Orphan' } } })).toBeNull()
  })
})
