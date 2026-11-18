/**
 * Proves the "learn more" link carries the reader's locale.
 *
 * `documentHref` hands this component a locale-free path, so an English
 * render cannot tell a prefixed link from an unprefixed one. A non-English
 * `pageContext` is the one assertion that can.
 *
 * It lives in its own file because the `pageContext` mock is module-wide.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { anchorFor } from '../../../tests/_helpers/markup'

vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => ({ locale: 'fr', urlPathname: '/fr/index' }),
}))

const { SubtleSystem } = await import('./SubtleSystem')

const render = (linkHref: string) =>
  renderToStaticMarkup(
    <SubtleSystem
      items={[{ id: 'chakra_1', title: 'Mooladhara', description: 'Innocence', linkHref }]}
    />,
  )

// The component inlines a 325 KB SVG, so each render is an expensive string.
const prefixed = render('/about')

describe('<SubtleSystem> in a non-English locale', () => {
  it('prefixes the article link with the locale', () => {
    expect(prefixed).toContain('href="/fr/about"')
  })

  it('renders no href at all for a refused scheme', () => {
    const html = render('javascript:alert(1)')

    expect(html).toContain('Mooladhara')
    expect(html).not.toContain('javascript:')
  })

  it('keeps the link’s accessible name, and its own layout class', () => {
    const anchor = anchorFor(prefixed, '/fr/about')

    expect(anchor).toContain('aria-label="Learn more about Mooladhara"')
    expect(anchor).toContain('inline-block')
    // `primary` draws the teal pair the hand-written classes did. The atom
    // owns the rest of that variant, and `Link.test.tsx` pins it.
    expect(anchor).toContain('text-primary')
  })
})
