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

const item = (linkHref: string) => [
  { id: 'chakra_1', title: 'Mooladhara', description: 'Innocence', linkHref },
]

describe('<SubtleSystem> in a non-English locale', () => {
  it('prefixes the article link with the locale', () => {
    const html = renderToStaticMarkup(<SubtleSystem items={item('/about')} />)

    expect(html).toContain('href="/fr/about"')
  })

  it('leaves an absolute URL and a bare anchor alone', () => {
    for (const href of ['https://example.com/x', '#section']) {
      expect(renderToStaticMarkup(<SubtleSystem items={item(href)} />)).toContain(`href="${href}"`)
    }
  })

  it('renders no href at all for a refused scheme', () => {
    const html = renderToStaticMarkup(<SubtleSystem items={item('javascript:alert(1)')} />)

    expect(html).toContain('Mooladhara')
    expect(html).not.toContain('javascript:')
  })

  it('keeps the link’s accessible name, and its drawn styling', () => {
    const anchor = anchorFor(
      renderToStaticMarkup(<SubtleSystem items={item('/about')} />),
      '/fr/about',
    )

    expect(anchor).toContain('aria-label="Learn more about Mooladhara"')
    // `primary` draws the same teal pair the hand-written classes did, through
    // the surface tokens, and the atom adds the focus ring the anchor lacked.
    expect(anchor).toContain('inline-block')
    expect(anchor).toContain('text-primary')
    expect(anchor).toContain('hover:text-primary-strong')
    expect(anchor).toContain('font-medium')
    expect(anchor).toContain('transition-colors')
    expect(anchor).toContain('focus-ring')
  })
})
