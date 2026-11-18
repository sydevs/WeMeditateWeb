/**
 * Proves the call to action carries the reader's locale.
 *
 * `Splash.test.tsx` renders it in English, where a prefixed href and an
 * unprefixed one are the same string. A non-English `pageContext` is the one
 * assertion that can tell them apart, so a return to a bare anchor fails
 * rather than passing green.
 *
 * It lives in its own file because the `pageContext` mock is module-wide.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => ({ locale: 'fr', urlPathname: '/fr/index' }),
}))

const { Splash } = await import('./Splash')

describe('<Splash> call to action in a non-English locale', () => {
  it('prefixes a site path with the locale', () => {
    const html = renderToStaticMarkup(
      <Splash
        backgroundImage="/splash-bg.jpg"
        ctaHref="/meditations"
        ctaText="Begin"
        title="Welcome"
      />,
    )

    expect(html).toContain('href="/fr/meditations"')
  })
})
