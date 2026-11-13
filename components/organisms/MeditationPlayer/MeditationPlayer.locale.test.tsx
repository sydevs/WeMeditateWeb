/**
 * Proves both upsell sentences reach the markup from SahajCloud.
 *
 * The three keys hold the same English the component used to hardcode, so an
 * English render cannot tell a wired-up sentence from the old literal. A
 * non-English `pageContext` is the one assertion that can.
 *
 * It lives in its own file because the `pageContext` mock is module-wide.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { WebTranslations } from '../../../server/sahajcloud-types'
import { EN_TRANSLATIONS } from '../../../lib/i18n'
import type { Track } from '../../molecules/AudioPlayer/types'

// Spread rather than hand-built, so the fixture needs no cast and stays valid
// when `WebTranslations` gains a required branch.
const FRENCH: WebTranslations = {
  ...EN_TRANSLATIONS,
  meditation: {
    ...EN_TRANSLATIONS.meditation,
    general: {
      ...EN_TRANSLATIONS.meditation.general,
      upsell_web: 'Trouvez plus de méditations sur %{link}',
      upsell_app: 'Trouvez des méditations interactives avec de la musique dans notre %{link}',
      upsell_app_link: 'application gratuite',
    },
  },
}

vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => ({ locale: 'fr', translations: FRENCH, urlPathname: '/index' }),
}))

const { MeditationPlayer } = await import('./MeditationPlayer')

const track: Track = {
  url: 'https://example.com/voice.mp3',
  title: 'Méditation',
  credit: '',
  creditURL: '',
  thumbnailURL: '',
  duration: 600,
}

describe('the MeditationPlayer upsell in a non-English locale', () => {
  it('renders the SahajCloud web sentence around the domain, not the English literal', () => {
    const html = renderToStaticMarkup(<MeditationPlayer frames={[]} track={track} upsell="web" />)

    expect(html).toContain('Trouvez plus de méditations sur')
    expect(html).not.toContain('Find more meditations on')
    // The domain is a brand name, so it stays English inside the translated
    // sentence.
    expect(html).toContain('wemeditate.com</a>')
    expect(html).toContain('href="https://wemeditate.com/meditations"')
  })

  it('renders the SahajCloud app sentence and its translated link text', () => {
    const html = renderToStaticMarkup(<MeditationPlayer frames={[]} track={track} upsell="app" />)

    expect(html).toContain('Trouvez des méditations interactives avec de la musique dans notre')
    expect(html).not.toContain('Find interactive meditations')
    expect(html).toContain('application gratuite')
    expect(html).not.toContain('free app')
    expect(html).toContain('href="https://wemeditate.com/app"')
  })
})
