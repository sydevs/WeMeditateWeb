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

describe('textbox block converter — routing', () => {
  it('left/right → ContentTextBox (white box, not parchment or overlay)', () => {
    const html = renderTextbox({ imagePosition: 'left', title: 'Hi', subtitle: 'Sub' })

    expect(html).toContain('lg:bg-white')
    expect(html).not.toContain('bg-warm')
    expect(html).toContain('Sub') // subtitle threaded through
  })

  it('overlay → ContentOverlay, mapping textColor="light" to white text', () => {
    const html = renderTextbox({ imagePosition: 'overlay', textColor: 'light', title: 'Hi' })

    expect(html).toContain('text-white')
    expect(html).toContain('text-glow-dark')
    expect(html).not.toContain('bg-warm')
  })

  it('overlay with textColor="dark" renders dark text (no white)', () => {
    const html = renderTextbox({ imagePosition: 'overlay', textColor: 'dark', title: 'Hi' })

    expect(html).not.toContain('text-white')
  })

  it('threads the subtitle into the overlay', () => {
    const html = renderTextbox({
      imagePosition: 'overlay',
      title: 'Hi',
      subtitle: 'Collective meditation',
    })

    expect(html).toContain('Collective meditation')
  })

  it('wisdomStyle (side layout) → OrnateTextBox (ornate ground + sidetext)', () => {
    const html = renderTextbox({ imagePosition: 'left', wisdomStyle: true, title: 'Wisdom' })

    expect(html).toContain('#6b5340') // warm ornate gradient ground
    expect(html).toContain('Ancient Wisdom') // decorative sidetext
    expect(html).not.toContain('lg:bg-white') // not the plain ContentTextBox
  })

  it('overlay takes precedence over wisdomStyle (no ornate ground)', () => {
    const html = renderTextbox({ imagePosition: 'overlay', wisdomStyle: true, title: 'Wisdom' })

    expect(html).not.toContain('#6b5340')
  })

  it('renders nothing when the image is an unpopulated (bare-id) relationship', () => {
    expect(textbox({ node: { fields: { image: 123, title: 'Orphan' } } })).toBeNull()
  })
})
