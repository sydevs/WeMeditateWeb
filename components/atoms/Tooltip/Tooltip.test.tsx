import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Tooltip } from './Tooltip'

/**
 * SSR markup assertions only. The tooltip bubble is hidden on first render (it
 * opens on hover/focus on the client and is portaled), so we assert the trigger
 * renders and the bubble content is absent until shown. Hover/focus/placement
 * are verified in Ladle / the browser.
 */
describe('Tooltip', () => {
  it('renders the trigger and keeps the label hidden until hovered/focused', () => {
    const html = renderToStaticMarkup(
      <Tooltip label="Change background music track">
        <button aria-label="Shuffle music track">icon</button>
      </Tooltip>,
    )

    expect(html).toContain('aria-label="Shuffle music track"')
    expect(html).toContain('icon')
    // Closed by default → the label is not in the SSR output.
    expect(html).not.toContain('Change background music track')
  })
})
