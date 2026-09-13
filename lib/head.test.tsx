import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ContentHeadTags, resolveOgImageUrl } from './head'
import { buildAlternates } from './hreflang'

const CF_URL = 'https://imagedelivery.net/acct/abc123/'

describe('resolveOgImageUrl', () => {
  it('appends a large video variant to a Cloudflare image URL', () => {
    expect(resolveOgImageUrl({ url: CF_URL })).toBe(`${CF_URL}video-1024`)
  })

  it('returns a non-Cloudflare URL unchanged', () => {
    const external = 'https://example.com/preview.jpg'

    expect(resolveOgImageUrl({ url: external })).toBe(external)
  })

  it('returns null for a bare id (unpopulated relationship)', () => {
    expect(resolveOgImageUrl(7)).toBeNull()
  })

  it('returns null when the image or its url is missing', () => {
    expect(resolveOgImageUrl(null)).toBeNull()
    expect(resolveOgImageUrl(undefined)).toBeNull()
    expect(resolveOgImageUrl({})).toBeNull()
    expect(resolveOgImageUrl({ url: null })).toBeNull()
  })
})

describe('ContentHeadTags', () => {
  const ORIGIN = 'https://wemeditate.com'
  const cluster = (locales: Parameters<typeof buildAlternates>[0]['locales']) =>
    renderToStaticMarkup(
      <ContentHeadTags
        alternates={buildAlternates({ origin: ORIGIN, path: '/about', locales })}
        canonical={`${ORIGIN}/about`}
      />,
    )

  it('emits a self-referential canonical', () => {
    expect(cluster([])).toContain('<link href="https://wemeditate.com/about" rel="canonical"/>')
  })

  it('emits the canonical even where there is no cluster', () => {
    // A meditation or a lecture carries no per-locale publish state. It
    // still needs a canonical — and an hreflang cluster whose members are
    // not self-canonical is one Google discards, so these ship together.
    const html = cluster([])

    expect(html).toContain('rel="canonical"')
    expect(html).not.toContain('rel="alternate"')
  })

  it('emits one alternate per advertised locale, plus x-default', () => {
    const html = cluster(['en', 'fr'])

    expect(html).toContain('<link rel="alternate" hreflang="en" href="https://wemeditate.com/about"/>')
    expect(html).toContain(
      '<link rel="alternate" hreflang="fr" href="https://wemeditate.com/fr/about"/>',
    )
    expect(html).toContain(
      '<link rel="alternate" hreflang="x-default" href="https://wemeditate.com/about"/>',
    )
  })

  it('spells the attribute lowercase, for crawlers that pattern-match', () => {
    // React emits the prop as authored, so `hrefLang` would ship as-is.
    // Some crawlers match on the raw text instead of parsing.
    const html = cluster(['en'])

    expect(html).toContain('hreflang=')
    expect(html).not.toContain('hrefLang=')
  })

  it('never advertises a locale the document is not published in', () => {
    // The end-to-end shape of the criterion `advertisedLocales` enforces:
    // a page published only in English advertises only English, whatever
    // the site's own locale set says.
    const html = cluster(['en'])

    expect(html).not.toContain('/fr/about')
  })
})
