/**
 * The picker's links.
 *
 * `LanguageOption.href` is a bare path; `Link` adds the prefix for the
 * option's own `locale`. That split is easy to undo by accident — passing
 * an already-prefixed href would produce `/fr/fr/about` — so it is pinned
 * here rather than left to the layout that builds the options.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

// The dropdown renders its panel behind a click, so the options are not in
// the SSR markup. Reduce Dropdown to a passthrough to assert on the links.
vi.mock('../../atoms/Dropdown', () => ({
  Dropdown: ({ children, trigger }: { children: React.ReactNode; trigger: React.ReactNode }) => (
    <div>
      {trigger}
      {children}
    </div>
  ),
}))
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

describe('LanguageDropdown', () => {
  it('serves English bare and prefixes every other locale', () => {
    const html = renderToStaticMarkup(
      <LanguageDropdown currentLanguage="fr" languages={languages} />,
    )

    expect(html).toContain('href="/about"')
    expect(html).toContain('href="/fr/about"')
    expect(html).toContain('href="/pt-BR/about"')
  })

  it('never double-prefixes, whatever the current locale', () => {
    const html = renderToStaticMarkup(
      <LanguageDropdown currentLanguage="fr" languages={languages} />,
    )

    expect(html).not.toContain('/fr/fr/')
    expect(html).not.toContain('/fr/pt-BR/')
  })

  it('labels the trigger from the CMS', () => {
    const html = renderToStaticMarkup(
      <LanguageDropdown currentLanguage="en" languages={languages} />,
    )

    expect(html).toContain('Languages')
  })
})
