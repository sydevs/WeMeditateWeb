/**
 * Proves every visible string reaches the markup from SahajCloud: the heading
 * and its subtitle from `discover.general`, each action from its page.
 *
 * `discover.general` holds the same English the component used to hardcode,
 * so an English render cannot tell a wired-up string from the old literal.
 * A non-English `pageContext` is the one assertion that can.
 *
 * It lives in its own file because the `pageContext` mock is module-wide.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { NavPage, WebTranslations } from '../../../server/sahajcloud-types'
import { EN_TRANSLATIONS } from '../../../lib/i18n'
import { anchorFor } from '../../../tests/_helpers/markup'

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

/** `classPages` as a French config read returns it. */
const PAGES: NavPage[] = [
  {
    id: 14,
    slug: 'live-meditations',
    title: 'Méditations en direct',
    meta: { description: 'Méditez en ligne avec un instructeur' },
  },
  { id: 11, slug: 'classes-near-me', title: 'Cours près de chez vous' },
]

vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => ({ locale: 'fr', translations: FRENCH, urlPathname: '/index' }),
}))

/**
 * The rendered text, with the entities React escapes in a text node undone.
 *
 * Without this, any assertion on a string holding an apostrophe is vacuous —
 * `Don't` renders as `Don&#x27;t`, so `not.toContain` can never fail and the
 * one string this test most needs to guard goes unchecked.
 */
function text(html: string): string {
  return html
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

const { DiscoverMeditation } = await import('./DiscoverMeditation')

describe('DiscoverMeditation in a non-English locale', () => {
  it('renders the heading strings from SahajCloud, and no English literal', () => {
    const rendered = text(renderToStaticMarkup(<DiscoverMeditation pages={PAGES} />))

    expect(rendered).toContain(FRENCH.discover.general.title)
    expect(rendered).toContain(FRENCH.discover.general.subtitle)
    // The snapshot, not a copy of it: a reworded key upstream would otherwise
    // leave this asserting against English the component no longer holds.
    for (const english of Object.values(EN_TRANSLATIONS.discover.general)) {
      expect(rendered).not.toContain(english)
    }
  })

  it('names each action by its page, in the locale, under a localized href', () => {
    const html = renderToStaticMarkup(<DiscoverMeditation pages={PAGES} />)
    const rendered = text(html)

    expect(anchorFor(html, '/fr/live-meditations')).not.toBe('')
    expect(anchorFor(html, '/fr/classes-near-me')).not.toBe('')
    expect(rendered).toContain('Méditations en direct')
    expect(rendered).toContain('Méditez en ligne avec un instructeur')
    expect(rendered).toContain('Cours près de chez vous')
  })

  it('reads none of the six per-action keys, which the pages replaced', () => {
    const rendered = text(renderToStaticMarkup(<DiscoverMeditation pages={PAGES} />))
    const perAction = Object.entries(FRENCH.discover.general).filter(
      ([key]) => key !== 'title' && key !== 'subtitle',
    )

    expect(perAction).toHaveLength(6)
    for (const [, french] of perAction) {
      expect(rendered).not.toContain(french)
    }
  })

  it('still lets a caller override the heading and subtitle', () => {
    const rendered = text(
      renderToStaticMarkup(
        <DiscoverMeditation
          pages={PAGES}
          subtitle="Essayez par vous-même"
          title="Un autre titre"
        />,
      ),
    )

    expect(rendered).toContain('Un autre titre')
    expect(rendered).toContain('Essayez par vous-même')
    expect(rendered).not.toContain('Découvrez-le par vous-même !')
  })
})
