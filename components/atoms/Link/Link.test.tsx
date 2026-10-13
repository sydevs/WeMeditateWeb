import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Link } from './Link'

/**
 * These render bare, with no Vike app around them, so `usePageContext()`
 * returns `undefined` and `useOptionalPageContext()` returns null — the same
 * shape Ladle renders in.
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

  it('drops a trailing slash, in every locale', () => {
    // `RichText` hands `Link` the URL an editor types in the link dialog, so
    // `/about/` is reachable without any hand-written JSX. The canonical for
    // that page is `/fr/about`, and one document may not spell it two ways.
    expect(
      renderToStaticMarkup(
        <Link href="/about/" locale="fr">
          x
        </Link>,
      ),
    ).toContain('href="/fr/about"')

    // English is affected too: `localePath` passes the path through unprefixed.
    expect(
      renderToStaticMarkup(
        <Link href="/about/" locale="en">
          x
        </Link>,
      ),
    ).toContain('href="/about"')

    // And with no locale prop at all, which is how most call sites render.
    expect(renderToStaticMarkup(<Link href="/about/">x</Link>)).toContain('href="/about"')
  })

  it('leaves a slash alone inside a query or a fragment', () => {
    // An editor can type either into the rich-text link dialog, and there a
    // trailing slash belongs to the value, not to the path.
    expect(
      renderToStaticMarkup(
        <Link href="/share?url=https://example.com/" locale="fr">
          x
        </Link>,
      ),
    ).toContain('href="/fr/share?url=https://example.com/"')
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

  it('leaves an href that is not a path on this site alone', () => {
    // Each of these once had a locale glued on: `/frmailto:…`, `/fr//cdn…`.
    for (const href of ['mailto:hello@example.com', 'tel:+1234567890', '//cdn.example.com/x', '']) {
      const html = renderToStaticMarkup(
        <Link href={href} locale="fr">
          x
        </Link>,
      )

      expect(html).toContain(`href="${href}"`)
    }
  })

  it('falls back to the default locale with no pageContext', () => {
    // Without the fallback this renders `/undefined/about`. The deployed site
    // is guarded against that shape by tests/smoke/web/pages.smoke.test.ts.
    const html = renderToStaticMarkup(<Link href="/about">x</Link>)

    expect(html).toContain('href="/about"')
    expect(html).not.toContain('undefined')
  })

  it('keeps a region-cased locale exactly as SahajCloud stores it', () => {
    expect(
      renderToStaticMarkup(
        <Link href="/about" locale="pt-BR">
          x
        </Link>,
      ),
    ).toContain('href="/pt-BR/about"')
  })
})

describe('<Link> focus indicator', () => {
  // `unstyled` maps to '' in both variant maps, so it also proves the ring
  // lives in `baseStyles` rather than in a variant entry (#133).
  it('draws `focus-ring` on every variant', () => {
    for (const variant of ['default', 'unstyled'] as const) {
      const html = renderToStaticMarkup(
        <Link href="/about" variant={variant}>
          About
        </Link>,
      )

      expect(html).toMatch(/class="[^"]*\bfocus-ring\b/)
    }
  })

  // Setting a surface without being told would override the container's,
  // which is how a logo over a dark splash drew a light ring.
  it('inherits its surface when no theme is given', () => {
    const html = renderToStaticMarkup(<Link href="/about">About</Link>)

    expect(html).not.toContain('surface-')
  })

  it('claims the surface its theme names', () => {
    for (const theme of ['light', 'dark'] as const) {
      const html = renderToStaticMarkup(
        <Link href="/about" theme={theme}>
          About
        </Link>,
      )

      expect(html).toContain(`surface-${theme}`)
    }
  })

  it('carries no ring colour of its own', () => {
    const html = renderToStaticMarkup(
      <Link href="/about" theme="dark">
        About
      </Link>,
    )

    expect(html).not.toMatch(/\bring-/)
  })
})
