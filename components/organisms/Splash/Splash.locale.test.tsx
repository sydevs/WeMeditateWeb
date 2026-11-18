/**
 * Proves the call to action carries the reader's locale.
 *
 * `Splash.test.tsx` renders it in English, where a prefixed href and an
 * unprefixed one are the same string. A non-English `pageContext` is the one
 * assertion that can tell them apart.
 *
 * It lives in its own file because the `pageContext` mock is module-wide.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => ({ locale: 'fr', urlPathname: '/fr/index' }),
}))

const { Splash } = await import('./Splash')

const splash = (ctaHref: string) =>
  renderToStaticMarkup(
    <Splash backgroundImage="/splash-bg.jpg" ctaHref={ctaHref} ctaText="Begin" title="Welcome" />,
  )

describe('<Splash> call to action in a non-English locale', () => {
  it('prefixes a site path with the locale', () => {
    expect(splash('/meditations')).toContain('href="/fr/meditations"')
  })

  it('leaves an absolute URL and a bare anchor alone', () => {
    for (const href of ['https://example.com/x', '#section']) {
      expect(splash(href)).toContain(`href="${href}"`)
    }
  })
})
