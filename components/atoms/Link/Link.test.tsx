import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
    // Each of these once had a locale glued on: `/frmailto:…`.
    for (const href of ['mailto:hello@example.com', 'tel:+1234567890']) {
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

  it('carries no ring colour of its own', () => {
    const html = renderToStaticMarkup(<Link href="/about">About</Link>)

    expect(html).not.toMatch(/\bring-/)
  })
})

describe('<Link> transition', () => {
  // A `transition-property` the caller did not ask for overrides the one it
  // did, at equal specificity and later source order. That is what kept
  // `Splash`'s transform hover out of the atom (#257).
  it('leaves `unstyled` with no transition at all', () => {
    const html = renderToStaticMarkup(
      <Link href="/about" variant="unstyled">
        About
      </Link>,
    )

    expect(html).toMatch(/class="/)
    expect(html).not.toMatch(/\btransition-/)
  })

  it('transitions the colour on every variant that paints one', () => {
    for (const variant of ['default', 'primary', 'secondary', 'neutral'] as const) {
      const html = renderToStaticMarkup(
        <Link href="/about" variant={variant}>
          About
        </Link>,
      )

      expect(html, variant).toContain('transition-colors')
    }
  })
})

describe('<Link> surface', () => {
  // A link on a dark surface lightens because its colours are surface
  // tokens, not because a caller remembered a `theme` prop.
  it('colours every variant from surface tokens, never a scale step', () => {
    for (const variant of ['default', 'primary', 'secondary', 'neutral'] as const) {
      const html = renderToStaticMarkup(
        <Link href="/about" variant={variant}>
          About
        </Link>,
      )

      expect(html).not.toMatch(/\btext-(white|gray|teal|coral)\b/)
      expect(html).toMatch(/\btext-(primary|secondary|fg-muted)\b/)
    }
  })

  it('never sets a surface', () => {
    expect(renderToStaticMarkup(<Link href="/about">About</Link>)).not.toContain('surface-')
  })
})

describe('<Link> scheme gate', () => {
  // Every refusal warns, so the spy is the whole describe's rather than
  // four copies of the same two lines.
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // `RichText`, `LayoutBlock`, `Playlist` and a rich-text button block all
  // hand `Link` a URL an editor typed into SahajCloud. This is the only place
  // that gate lives, so a call site never restates it.
  it('renders no href for a scheme that would execute in our origin', () => {
    for (const href of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>']) {
      const html = renderToStaticMarkup(<Link href={href}>Click me</Link>)

      expect(html, href).not.toContain('href')
      expect(html, href).not.toContain(href.slice(0, href.indexOf(':')))
      // The words still render, so the page does not lose its content.
      expect(html, href).toContain('Click me')
    }
  })

  it('names the refused href once, in development', () => {
    renderToStaticMarkup(<Link href="javascript:alert(1)">x</Link>)

    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(vi.mocked(console.warn).mock.calls[0][0]).toContain('javascript:alert(1)')
  })

  // These two rendered an href before this gate existed, so the component
  // pins them even though `lib/urls.test.ts` owns the allowlist itself.
  it('renders no href for a protocol-relative URL or an unset one', () => {
    for (const href of ['//cdn.example.com/x', '']) {
      expect(renderToStaticMarkup(<Link href={href}>x</Link>), href).not.toContain('href')
    }
  })

  it('opens no tab for a href it refused', () => {
    const html = renderToStaticMarkup(
      <Link external href="javascript:alert(1)">
        x
      </Link>,
    )

    expect(html).not.toContain('_blank')
    expect(html).not.toContain('opens in new tab')
  })
})

describe('<Link> new-tab announcement', () => {
  // The string comes from SahajCloud. These render with no `pageContext`, so
  // `useT` falls back to `lib/translations.en.json`, the committed mirror.
  it('names the new tab in screen-reader-only text after the link words', () => {
    const html = renderToStaticMarkup(
      <Link external href="https://example.com">
        Our partner
      </Link>,
    )

    expect(html).toContain('_blank')
    expect(html).toMatch(/class="sr-only">\(opens in new tab\)</)
    // After the words, so a reader hears the destination first.
    expect(html.indexOf('Our partner')).toBeLessThan(html.indexOf('sr-only'))
  })

  it('says nothing extra on a link that stays in this tab', () => {
    const html = renderToStaticMarkup(<Link href="/about">About</Link>)

    expect(html).not.toContain('sr-only')
    expect(html).not.toContain('opens in new tab')
  })

  it('folds the warning into an aria-label, which would otherwise hide it', () => {
    // An `aria-label` replaces the accessible name, so an `sr-only` child
    // inside the anchor is never read. `SocialShare` lost the announcement
    // exactly this way.
    const html = renderToStaticMarkup(
      <Link external aria-label="Our partner" href="https://example.com">
        <span>icon</span>
      </Link>,
    )

    expect(html).toContain('aria-label="Our partner (opens in new tab)"')
    expect(html).not.toContain('sr-only')
  })
})
