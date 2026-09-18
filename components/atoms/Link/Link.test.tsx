import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Link } from './Link'

/**
 * These render bare, with no Vike app around them, so `usePageContext()`
 * throws and `useOptionalPageContext()` returns null — the same shape Ladle
 * renders in.
 */
describe('<Link> locale prefixing', () => {
  it('spells the home page /fr, not /fr/', () => {
    // The language dropdown hands `Link` the normalized `/` on the home page.
    // `/fr/` would contradict the canonical the same page emits.
    const html = renderToStaticMarkup(
      <Link href="/" locale="fr">
        Accueil
      </Link>,
    )

    expect(html).toContain('href="/fr"')
    expect(html).not.toContain('href="/fr/"')
  })

  it('prefixes a content path, and serves English bare', () => {
    expect(
      renderToStaticMarkup(
        <Link href="/about" locale="fr">
          x
        </Link>,
      ),
    ).toContain('href="/fr/about"')

    expect(
      renderToStaticMarkup(
        <Link href="/about" locale="en">
          x
        </Link>,
      ),
    ).toContain('href="/about"')
  })

  it('leaves an external URL alone', () => {
    const html = renderToStaticMarkup(
      <Link href="https://example.com" locale="fr">
        x
      </Link>,
    )

    expect(html).toContain('href="https://example.com"')
    expect(html).not.toContain('/fr')
  })

  it('leaves an in-page anchor alone', () => {
    const html = renderToStaticMarkup(
      <Link href="#section" locale="fr">
        x
      </Link>,
    )

    expect(html).toContain('href="#section"')
    expect(html).not.toContain('/fr')
  })

  it('falls back to the default locale with no pageContext', () => {
    // Without the fallback this renders `/undefined/about`. The deployed site
    // is guarded against that shape by tests/smoke/web/pages.smoke.test.ts.
    const html = renderToStaticMarkup(<Link href="/about">x</Link>)

    expect(html).toContain('href="/about"')
    expect(html).not.toContain('undefined')
  })

  it('keeps a region-cased locale exactly as the CMS stores it', () => {
    expect(
      renderToStaticMarkup(
        <Link href="/about" locale="pt-BR">
          x
        </Link>,
      ),
    ).toContain('href="/pt-BR/about"')
  })
})
