// @vitest-environment jsdom
/**
 * The open popover, which the SSR spec beside this file cannot reach: the
 * panel mounts only after a click.
 */

import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { EN_TRANSLATIONS } from '../../../lib/i18n'
import { axeViolations } from '../../../tests/_helpers/axe'
import { openPanel } from '../../../tests/_helpers/popover'
import { EmbedButton } from './EmbedButton'

const { media } = EN_TRANSLATIONS

describe('EmbedButton, open', () => {
  it('opens a dialog named by its own visible heading', async () => {
    render(
      <EmbedButton
        embedPath="/meditations/123/embed"
        locale="en"
        origin="https://wemeditate.com"
        title="Letting The Day Settle"
      />,
    )

    const { trigger, panel: dialog } = openPanel(media.general.embed)

    // A snippet, a field and a button are not a `menu`'s `menuitem`s.
    expect(screen.queryByRole('menu')).toBeNull()
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(screen.getByRole('dialog', { name: 'Embed “Letting The Day Settle”' })).toBe(dialog)
    expect(within(dialog).getByRole('textbox', { name: media.a11y.embed_code })).toBeTruthy()
    expect(within(dialog).getByRole('button', { name: media.general.copy })).toBeTruthy()
    expect(await axeViolations()).toEqual([])
  })

  it('falls back to the generic heading for its name when there is no title', () => {
    render(
      <EmbedButton embedPath="/lectures/456/embed" locale="en" origin="https://wemeditate.com" />,
    )

    fireEvent.click(screen.getByRole('button', { name: media.general.embed }))

    expect(screen.getByRole('dialog', { name: media.general.embed_player })).toBeTruthy()
  })
})
