import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { anchorFor } from '../../../tests/_helpers/markup'
import { Dropdown, DropdownItem } from './Dropdown'

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

    // The inner control owns focus in this mode. The wrapper stays transparent.
    expect(html).not.toContain('role="button"')
    expect(html).not.toContain('tabindex="0"')
    expect(html).toContain('aria-label="Search"')
  })
})

describe('DropdownItem', () => {
  it('locale-prefixes a site path', () => {
    const html = renderToStaticMarkup(
      <DropdownItem href="/meditations" locale="fr">
        Meditations
      </DropdownItem>,
    )

    expect(html).toContain('href="/fr/meditations"')
  })

  it('leaves an absolute URL, a mail address, a phone number and an anchor alone', () => {
    const untouched = ['https://example.com/x', 'mailto:hi@example.com', 'tel:+123', '#section']

    for (const href of untouched) {
      expect(
        renderToStaticMarkup(
          <DropdownItem href={href} locale="fr">
            Item
          </DropdownItem>,
        ),
      ).toContain(`href="${href}"`)
    }
  })

  it('renders no href at all for a refused scheme', () => {
    const html = renderToStaticMarkup(<DropdownItem href="javascript:alert(1)">Item</DropdownItem>)

    expect(html).toContain('Item')
    expect(html).not.toContain('javascript:')
  })

  it('keeps its own item styling, and takes the atom’s focus ring', () => {
    const anchor = anchorFor(
      renderToStaticMarkup(
        <DropdownItem href="/meditations" size="lg">
          Meditations
        </DropdownItem>,
      ),
      '/meditations',
    )

    expect(anchor).toContain('hover:bg-gray-100')
    expect(anchor).toContain('px-6 py-4 text-base')
    expect(anchor).toContain('focus-ring')
  })
})
