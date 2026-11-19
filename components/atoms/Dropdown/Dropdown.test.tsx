import { describe, it, expect } from 'vitest'
import type { ReactElement } from 'react'
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
  it('wires the trigger element itself, and keeps the panel closed', () => {
    const html = renderToStaticMarkup(
      <Dropdown trigger={<button type="button">Open</button>}>
        <div>Panel content</div>
      </Dropdown>,
    )

    // The caller's own control carries the popup state. A wrapper carrying
    // `role="button"` around it was axe `nested-interactive` and a second tab
    // stop (#278), so the wrapper must stay transparent here.
    const trigger = openTag(html, 'button')

    expect(trigger).toContain('aria-haspopup="menu"')
    expect(trigger).toContain('aria-expanded="false"')
    expect(html).not.toContain('role="button"')
    expect(html).not.toContain('tabindex="0"')
    expect(html).toContain('Open')
    // Closed by default → the panel (and its content) is not in the SSR output.
    expect(html).not.toContain('Panel content')
  })

  /** Rendered through a thunk, so no JSX element sits in an array literal. */
  const withTrigger = (trigger: () => ReactElement) =>
    renderToStaticMarkup(
      <Dropdown trigger={trigger()}>
        <div>Panel</div>
      </Dropdown>,
    )

  it.each([
    ['a fragment', () => <>{'Open'}</>],
    ['a bare span', () => <span>Open</span>],
  ])('falls back to a focusable wrapper for %s', (_what, trigger) => {
    // A fragment swallows cloned props, and a span has neither a role nor a
    // tab stop — so for either the wrapper is what makes the trigger operable.
    const html = withTrigger(trigger)

    expect(html).toContain('role="button"')
    expect(html).toContain('tabindex="0"')
  })

  it.each([
    ['a native <button>', () => <button type="button">Open</button>],
    ['the Button atom', () => <Button>Open</Button>],
  ])('wires %s directly, with no role on the wrapper', (_what, trigger) => {
    const html = withTrigger(trigger)

    expect(openTag(html, 'button')).toContain('aria-expanded="false"')
    expect(html).not.toContain('role="button"')
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
