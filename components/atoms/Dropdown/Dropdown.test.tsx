import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Dropdown } from './Dropdown'

/**
 * SSR markup assertions only. The panel is closed on first render (and portaled +
 * positioned by Floating UI on the client), so we assert the trigger contract and
 * that the panel content is absent until opened. Interactive behavior (open,
 * placement, flip/shift, dismiss) is verified in Ladle / the browser.
 */
describe('Dropdown', () => {
  it('renders the trigger as a focusable button and keeps the panel closed', () => {
    const html = renderToStaticMarkup(
      <Dropdown trigger={<span>Open</span>}>
        <div>Panel content</div>
      </Dropdown>,
    )

    expect(html).toContain('role="button"')
    expect(html).toContain('aria-haspopup="menu"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('tabindex="0"')
    expect(html).toContain('Open')
    // Closed by default → the panel (and its content) is not in the SSR output.
    expect(html).not.toContain('Panel content')
  })

  it('does not turn the wrapper into a button in focus (autocomplete) mode', () => {
    const html = renderToStaticMarkup(
      <Dropdown openOnFocus role="listbox" trigger={<input aria-label="Search" />}>
        <div>suggestions</div>
      </Dropdown>,
    )

    // The inner control owns focus in this mode; the wrapper stays transparent.
    expect(html).not.toContain('role="button"')
    expect(html).not.toContain('tabindex="0"')
    expect(html).toContain('aria-label="Search"')
  })
})
