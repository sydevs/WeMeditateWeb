/**
 * Proves every visible string reaches the markup from SahajCloud.
 *
 * `discover.general` holds the same English the component used to hardcode,
 * so an English render cannot tell a wired-up string from the old literal.
 * A non-English `pageContext` is the one assertion that can.
 *
 * It lives in its own file because the `pageContext` mock is module-wide.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { WebTranslations } from '../../../server/sahajcloud-types'
import { EN_TRANSLATIONS } from '../../../lib/i18n'

// Spread rather than hand-built, so the fixture needs no cast and stays valid
// when `WebTranslations` gains a required branch.
const FRENCH: WebTranslations = {
  ...EN_TRANSLATIONS,
  discover: {
    general: {
      title: 'Découvrez-le par vous-même !',
      subtitle: 'Ne nous croyez pas sur parole. Méditez et voyez ce que vous ressentez !',
      meditate_now: 'Méditer maintenant',
      meditate_now_subtitle: 'Méditations guidées en vidéo',
      live_guidance: 'Guidance en direct',
      live_guidance_subtitle: 'Méditations en ligne gratuites',
      classes_near_me: 'Cours près de moi',
      classes_near_me_subtitle: 'Cours gratuits en personne',
    },
  },
}

vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => ({ locale: 'fr', translations: FRENCH, urlPathname: '/index' }),
}))

const { DiscoverMeditation } = await import('./DiscoverMeditation')

describe('DiscoverMeditation in a non-English locale', () => {
  it('renders every SahajCloud string, and no English literal', () => {
    const html = renderToStaticMarkup(<DiscoverMeditation />)

    for (const french of Object.values(FRENCH.discover.general)) {
      expect(html).toContain(french)
    }
    // The snapshot, not a copy of it: a reworded key upstream would otherwise
    // leave this asserting against English the component no longer holds.
    for (const english of Object.values(EN_TRANSLATIONS.discover.general)) {
      expect(html).not.toContain(english)
    }
  })

  it('still lets a caller override the heading and subtitle', () => {
    const html = renderToStaticMarkup(
      <DiscoverMeditation subtitle="Essayez par vous-même" title="Un autre titre" />,
    )

    expect(html).toContain('Un autre titre')
    expect(html).toContain('Essayez par vous-même')
    expect(html).not.toContain('Découvrez-le par vous-même !')
  })
})
