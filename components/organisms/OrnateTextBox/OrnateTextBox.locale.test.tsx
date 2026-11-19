/**
 * Proves the sidetext never shows a visitor its key path.
 *
 * Live SahajCloud lacks `blocks.general.wisdom_sidetext` until
 * sydevs/SahajCloud#1218 merges, and the deployed `/heart-chakra` printed the
 * key. It lives in its own file because the `pageContext` mock is module-wide.
 */

import { afterEach, describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { WebTranslations } from '../../../server/sahajcloud-types'
import { EN_TRANSLATIONS } from '../../../lib/i18n'

// A deep copy, so the delete leaves the mirror itself whole.
const LIVE: WebTranslations = structuredClone(EN_TRANSLATIONS)

delete (LIVE.blocks.general as Partial<typeof LIVE.blocks.general>).wisdom_sidetext

vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => ({ locale: 'en', translations: LIVE, urlPathname: '/heart-chakra' }),
}))

const { OrnateTextBox } = await import('./OrnateTextBox')

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('OrnateTextBox when SahajCloud lacks the sidetext key', () => {
  it('draws the English mirror’s words, not the key path', () => {
    vi.stubEnv('DEV', false)

    const html = renderToStaticMarkup(
      <OrnateTextBox description="Body" imageAlt="" imageSrc="x" title="Title" />,
    )

    expect(html).toContain(`>${EN_TRANSLATIONS.blocks.general.wisdom_sidetext}<`)
    expect(html).not.toContain('blocks.general.wisdom_sidetext')
  })
})
