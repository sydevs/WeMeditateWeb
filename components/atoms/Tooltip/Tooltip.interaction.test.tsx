// @vitest-environment jsdom
/**
 * The shown tooltip, which the SSR spec beside this file cannot reach: it
 * mounts only on hover or focus.
 */

import { act } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Tooltip } from './Tooltip'

describe('Tooltip, shown', () => {
  it('describes the control it wraps, not the wrapper around it', () => {
    render(
      <Tooltip label="Change background music track">
        <button aria-label="Shuffle music track" type="button">
          icon
        </button>
      </Tooltip>,
    )

    const button = screen.getByRole('button', { name: 'Shuffle music track' })

    expect(button.hasAttribute('aria-describedby')).toBe(false)

    act(() => button.focus())

    const tooltip = screen.getByRole('tooltip')

    expect(button.getAttribute('aria-describedby')).toBe(tooltip.id)
    expect(
      screen.getByRole('button', {
        name: 'Shuffle music track',
        description: 'Change background music track',
      }),
    ).toBe(button)
    expect(document.querySelectorAll('[aria-describedby]')).toHaveLength(1)
  })

  it('keeps a description the control already names', () => {
    render(
      <>
        <p id="shuffle-hint">Picks another track</p>
        <Tooltip label="Change background music track">
          <button aria-describedby="shuffle-hint" aria-label="Shuffle music track" type="button">
            icon
          </button>
        </Tooltip>
      </>,
    )

    const button = screen.getByRole('button', { name: 'Shuffle music track' })

    act(() => button.focus())

    expect(button.getAttribute('aria-describedby')).toBe(
      `shuffle-hint ${screen.getByRole('tooltip').id}`,
    )
  })
})
