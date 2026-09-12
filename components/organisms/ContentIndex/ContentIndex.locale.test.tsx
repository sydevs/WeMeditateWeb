/**
 * Proves the CMS strings actually reach the markup.
 *
 * Every other component suite renders with the English snapshot, so they
 * would all still pass if `useT()` silently returned English regardless of
 * the page's locale. This one puts a non-English `pageContext` in front of a
 * component and checks the French comes out — the one assertion that
 * distinguishes "wired up" from "still hardcoded".
 *
 * It lives in its own file because the `pageContext` mock is module-wide.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { WebTranslations } from '../../../server/cms-types'

const FRENCH = {
  common: { general: {}, a11y: {} },
  article: {
    general: { filter_all: 'Tout' },
    a11y: { filter_label: 'Filtrer le contenu par étiquette' },
  },
} as unknown as WebTranslations

vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => ({ locale: 'fr', translations: FRENCH, urlPathname: '/index' }),
}))

const { ContentIndex } = await import('./ContentIndex')

const items = [
  {
    id: 1,
    title: 'Alpha',
    href: '#1',
    thumbnailSrc: '',
    tags: [{ id: 'wisdom', label: 'Sagesse' }],
  },
  {
    id: 2,
    title: 'Beta',
    href: '#2',
    thumbnailSrc: '',
    tags: [{ id: 'event', label: 'Événement' }],
  },
]

describe('ContentIndex in a non-English locale', () => {
  it('renders the CMS French, not the English snapshot', () => {
    const html = renderToStaticMarkup(<ContentIndex items={items} />)

    expect(html).toContain('Tout')
    expect(html).not.toContain('>All<')
  })

  it('translates the screen-reader-only filter label too', () => {
    const html = renderToStaticMarkup(<ContentIndex items={items} />)

    expect(html).toContain('aria-label="Filtrer le contenu par étiquette"')
    expect(html).not.toContain('Filter content by tag')
  })

  it('shows the facet labels the server resolved', () => {
    // These come down on the items, already localized by `+data.ts`.
    const html = renderToStaticMarkup(<ContentIndex items={items} />)

    expect(html).toContain('Sagesse')
    expect(html).toContain('Événement')
  })
})
