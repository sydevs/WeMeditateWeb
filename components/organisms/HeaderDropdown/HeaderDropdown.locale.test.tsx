/**
 * Proves the featured caption reaches the markup from SahajCloud.
 *
 * `navigation.featured_caption` holds the same English the component used to
 * hardcode, so an English render cannot tell a wired-up caption from the old
 * literal. A non-English `pageContext` is the one assertion that can.
 *
 * It lives in its own file because the `pageContext` mock is module-wide.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { WebTranslations } from '../../../server/sahajcloud-types'

const FRENCH = {
  navigation: { featured_caption: 'La source est en vous' },
} as unknown as WebTranslations

vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => ({ locale: 'fr', translations: FRENCH, urlPathname: '/index' }),
}))

const { HeaderDropdown } = await import('./HeaderDropdown')

const props = {
  title: 'Méditation',
  links: [{ label: 'Commencer', href: '/start' }],
  featuredArticles: [
    { title: 'Alpha', image: '', imageAlt: 'Alpha', href: '#1' },
    { title: 'Beta', image: '', imageAlt: 'Beta', href: '#2' },
  ],
}

describe('HeaderDropdown in a non-English locale', () => {
  it('renders the SahajCloud caption, not the English literal', () => {
    const html = renderToStaticMarkup(<HeaderDropdown {...props} />)

    expect(html).toContain('La source est en vous')
    expect(html).not.toContain('Inspiration comes from within')
  })
})
