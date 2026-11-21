import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Logo } from './Logo'

describe('Logo', () => {
  describe('the text variant', () => {
    it('draws the wordmark from the translated site title', () => {
      // `common.general.site_title` is "We Meditate" in lib/translations.en.json,
      // which is what `useT()` falls back to outside a Vike app. The mark's own
      // typography lower-cases everything after the initial capital, so the
      // casing is derived rather than restated per locale.
      expect(renderToStaticMarkup(<Logo variant="text" />)).toContain('>We meditate<')
    })

    it('breaks the wordmark a word per line when it is stacked to an edge', () => {
      // `align="left"` and `align="right"` stack the lockup, so each word takes
      // its own line. `whitespace-pre-line` is what renders the break.
      const left = renderToStaticMarkup(<Logo align="left" variant="text" />)

      expect(left).toContain('whitespace-pre-line')
      expect(left).toContain('>We\nmeditate<')
    })
  })

  describe('the inline variant', () => {
    it('sets the wordmark beside the icon, on one line', () => {
      // The header bar is a single 56px row, so the lockup cannot stack.
      const html = renderToStaticMarkup(<Logo variant="inline" />)

      expect(html).toContain('>We meditate<')
      expect(html).toContain('whitespace-nowrap')
      expect(html).not.toContain('flex-col')
    })

    it('floors a linked lockup at 44px, and only a linked one', () => {
      expect(renderToStaticMarkup(<Logo href="/" variant="inline" />)).toContain('touch-target')
      expect(renderToStaticMarkup(<Logo variant="inline" />)).not.toContain('touch-target')
    })
  })
})
