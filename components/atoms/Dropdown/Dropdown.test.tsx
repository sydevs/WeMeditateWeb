import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { anchorFor, openTag } from '../../../tests/_helpers/markup'
import { Button } from '../Button'
import { Dropdown, DropdownItem } from './Dropdown'

/**
 * SSR markup assertions only. The panel is closed on first render (and portaled +
 * positioned by Floating UI on the client), so we assert the trigger contract and
 * that the panel content is absent until opened. Interactive behavior (open,
 * placement, flip/shift, dismiss) is verified in Ladle / the browser.
 */
describe('Dropdown', () => {
  it("hands the popup state to the caller's own control, and keeps the panel closed", () => {
    const html = renderToStaticMarkup(
      <Dropdown
        trigger={(props) => (
          <button type="button" {...props}>
            Open
          </button>
        )}
      >
        <div>Panel content</div>
      </Dropdown>,
    )

    // A wrapper carrying `role="button"` around the caller's control was axe
    // `nested-interactive` and a second tab stop (#278). There is no wrapper
    // role to fall back to now: whatever the trigger renders is the control.
    const trigger = openTag(html, 'button')

    // The default panel is a disclosure: the trigger says it is collapsed,
    // and promises no popup role the panel would not keep.
    expect(trigger).toContain('aria-expanded="false"')
    expect(trigger).not.toContain('aria-haspopup')
    expect(html).not.toContain('role="button"')
    expect(html).not.toContain('tabindex="0"')
    expect(html).toContain('Open')
    // Closed by default → the panel (and its content) is not in the SSR output.
    expect(html).not.toContain('Panel content')
  })

  it('wires the Button atom the same way, through its own props', () => {
    // `Button` reaches its `<button>` by spreading, and React 19 carries `ref`
    // along with the rest — so the atom needs no special case for it.
    const html = renderToStaticMarkup(
      <Dropdown trigger={(props) => <Button {...props}>Open</Button>}>
        <div>Panel</div>
      </Dropdown>,
    )

    expect(openTag(html, 'button')).toContain('aria-expanded="false"')
    expect(html).not.toContain('role="button"')
  })

  it('does not turn the wrapper into a button in focus (autocomplete) mode', () => {
    const html = renderToStaticMarkup(
      <Dropdown openOnFocus role="listbox" trigger={() => <input aria-label="Search" />}>
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
