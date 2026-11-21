// @vitest-environment jsdom
/**
 * The open picker, with the real `Dropdown` — the SSR spec beside this file
 * reduces it to a passthrough, so it never sees the panel's semantics.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { axeViolations } from '../../../tests/_helpers/axe'
import { openPanel } from '../../../tests/_helpers/popover'

vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => ({ locale: 'fr', translations: EN_TRANSLATIONS }),
}))

const { LanguageDropdown } = await import('./LanguageDropdown')
const { EN_TRANSLATIONS } = await import('../../../lib/i18n')

const languages = [
  { code: 'en' as const, label: 'English', href: '/about' },
  { code: 'fr' as const, label: 'Français', href: '/about' },
  { code: 'pt-BR' as const, label: 'Português', href: '/about' },
]

describe('LanguageDropdown, open', () => {
  it('discloses a plain list of links, and marks the page being read', async () => {
    render(<LanguageDropdown currentLanguage="fr" languages={languages} />)

    const { trigger, panel } = openPanel(EN_TRANSLATIONS.footer.languages)

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(screen.queryByRole('menu')).toBeNull()

    const items = within(within(panel).getByRole('list')).getAllByRole('link')

    expect(items.map((link) => link.getAttribute('href'))).toEqual([
      '/about',
      '/fr/about',
      '/pt-BR/about',
    ])
    // Each option links to this page in its language, so the current one is
    // this page — the check mark says so only to a sighted reader.
    expect(within(panel).getByRole('link', { current: 'page' }).getAttribute('href')).toBe(
      '/fr/about',
    )
    expect(await axeViolations()).toEqual([])
  })
})
