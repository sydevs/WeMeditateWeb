/**
 * Proves the wordmark reaches the markup from SahajCloud.
 *
 * `common.general.site_title` holds the same two words the component used to
 * hardcode, so an English render cannot tell a wired-up wordmark from the old
 * literal. A non-English `pageContext` is the one assertion that can.
 *
 * It lives in its own file because the `pageContext` mock is module-wide.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { WebTranslations } from '../../../../server/sahajcloud-types'
import { EN_TRANSLATIONS } from '../../../../lib/i18n'

// Spread rather than hand-built, so the fixture needs no cast and stays valid
// when `WebTranslations` gains a required branch.
const FRENCH: WebTranslations = {
  ...EN_TRANSLATIONS,
  common: {
    ...EN_TRANSLATIONS.common,
    general: { ...EN_TRANSLATIONS.common?.general, site_title: 'Nous Méditons' },
  },
}

vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => ({ locale: 'fr', translations: FRENCH, urlPathname: '/index' }),
}))

const { Logo } = await import('./Logo')

describe('Logo in a non-English locale', () => {
  it('draws the SahajCloud title, not the English literal', () => {
    const html = renderToStaticMarkup(<Logo variant="text" />)

    expect(html).toContain('>Nous méditons<')
    expect(html).not.toContain('We meditate')
  })

  it('applies the mark’s casing and stacking to that title', () => {
    // The formatting is generic, so a locale gets the lockup without a second
    // key: the initial capital stays, the rest lower-cases, and the stacked
    // alignments take a line per word.
    const html = renderToStaticMarkup(<Logo align="left" variant="text" />)

    expect(html).toContain('>Nous\nméditons<')
  })
})
