// @vitest-environment jsdom
/**
 * The open panel, which the SSR spec beside this file cannot reach: the panel
 * mounts only after a click.
 */

import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { axeViolations } from '../../../tests/_helpers/axe'
import { Dropdown, DropdownItem } from './Dropdown'

/** Click the trigger, and hand back it and the panel it says it controls. */
function open(name: string) {
  const trigger = screen.getByRole('button', { name })

  fireEvent.click(trigger)

  const panel = document.getElementById(trigger.getAttribute('aria-controls') ?? '')

  if (!panel) throw new Error('the trigger controls no rendered panel')

  return { trigger, panel }
}

describe('Dropdown, open', () => {
  it('discloses a list of links by default, with no popup role on either side', async () => {
    render(
      <Dropdown
        trigger={(props) => (
          <button type="button" {...props}>
            Open
          </button>
        )}
      >
        <DropdownItem href="/first">First</DropdownItem>
        <DropdownItem href="/second">Second</DropdownItem>
      </Dropdown>,
    )

    const { trigger, panel } = open('Open')

    // A `menu` promises arrow-key navigation between `menuitem`s, which this
    // atom does not implement — a list of links is a disclosure.
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.hasAttribute('aria-haspopup')).toBe(false)
    expect(panel.hasAttribute('role')).toBe(false)
    expect(within(panel).getAllByRole('link')).toHaveLength(2)
    expect(await axeViolations()).toEqual([])
  })

  it('names a dialog panel and tells the trigger what it opens', async () => {
    render(
      <Dropdown
        ariaLabel="Display settings"
        role="dialog"
        trigger={(props) => (
          <button type="button" {...props}>
            Settings
          </button>
        )}
      >
        <label>
          Brightness
          <input type="range" />
        </label>
      </Dropdown>,
    )

    const { trigger, panel } = open('Settings')

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(screen.getByRole('dialog', { name: 'Display settings' })).toBe(panel)
    expect(await axeViolations()).toEqual([])
  })

  it('collapses again on a second click, and stops pointing at the panel', () => {
    render(
      <Dropdown
        trigger={(props) => (
          <button type="button" {...props}>
            Open
          </button>
        )}
      >
        <DropdownItem href="/first">First</DropdownItem>
      </Dropdown>,
    )

    const { trigger } = open('Open')

    fireEvent.click(trigger)

    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.hasAttribute('aria-controls')).toBe(false)
    expect(screen.queryByRole('link')).toBeNull()
  })
})
