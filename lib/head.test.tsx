import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { isSafeJsonLd, SeoHeadTags, seoDocument, type SeoHead } from './head'
import { buildAlternates } from './hreflang'

const ORIGIN = 'https://wemeditate.com'

function head(overrides: Partial<SeoHead> = {}): SeoHead {
  return {
    canonical: `${ORIGIN}/about`,
    alternates: [],
    meta: [],
    jsonLd: '',
    ...overrides,
  }
}

const render = (seo: SeoHead) => renderToStaticMarkup(<SeoHeadTags seo={seo} />)

describe('SeoHeadTags', () => {
  const cluster = (locales: Parameters<typeof buildAlternates>[0]['locales']) =>
    render(head({ alternates: buildAlternates({ origin: ORIGIN, path: '/about', locales }) }))

  it('emits the canonical alone where there is no cluster', () => {
    // A meditation or a lecture carries no per-locale publish state. It
    // still needs a canonical — and an hreflang cluster whose members are
    // not self-canonical is one Google discards, so these ship together.
    const html = cluster([])

    expect(html).toContain('<link href="https://wemeditate.com/about" rel="canonical"/>')
    expect(html).not.toContain('rel="alternate"')
  })

  it('omits the canonical entirely where the route publishes none', () => {
    expect(render(head({ canonical: null }))).not.toContain('rel="canonical"')
  })

  it('emits one alternate per advertised locale, plus x-default', () => {
    const html = cluster(['en', 'fr'])

    expect(html).toContain(
      '<link rel="alternate" hreflang="en" href="https://wemeditate.com/about"/>',
    )
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

  it('emits every meta pair it is given, repeats included', () => {
    // `og:locale:alternate` is the reason `meta` is a list and not a record.
    const html = render(
      head({
        meta: [
          ['og:locale:alternate', 'fr'],
          ['og:locale:alternate', 'de'],
        ],
      }),
    )

    expect(html).toContain('<meta content="fr" property="og:locale:alternate"/>')
    expect(html).toContain('<meta content="de" property="og:locale:alternate"/>')
  })

  it('emits the JSON-LD block verbatim, unescaped', () => {
    const html = render(head({ jsonLd: '{"@context":"https://schema.org","@graph":[]}' }))

    expect(html).toContain('<script type="application/ld+json">')
    // Not HTML-escaped: `&quot;` here would be invalid JSON-LD.
    expect(html).toContain('{"@context":"https://schema.org"')
    expect(html).not.toContain('&quot;')
  })

  it.each([
    ['a raw closing script tag', '{"name":"</script><img src=x onerror=alert(1)>"}'],
    ['a raw comment opener', '{"name":"<!--"}'],
  ])('drops the block entirely on %s', (_label, jsonLd) => {
    // Fail closed. Reaching here means a producer's escaping regressed. A
    // page that is merely less richly described beats one that executes
    // SahajCloud text.
    const html = render(head({ jsonLd }))

    expect(html).not.toContain('application/ld+json')
    expect(html).not.toContain('onerror')
  })
})

describe('isSafeJsonLd', () => {
  it('accepts a properly escaped document', () => {
    expect(isSafeJsonLd('{"name":"\\u003c/script\\u003e"}')).toBe(true)
  })

  it.each([
    ['</script>', '{"a":"</script>"}'],
    ['</SCRIPT> in any case', '{"a":"</SCRIPT >"}'],
    ['a comment opener', '{"a":"<!--"}'],
    ['an empty string', ''],
  ])('refuses %s', (_label, value) => {
    expect(isSafeJsonLd(value)).toBe(false)
  })
})

describe('seoDocument', () => {
  it('answers null for a route that built none', () => {
    // Every embed route and the error page. They publish no URL claim, and
    // the head settings then fall back to the site's own name.
    expect(seoDocument(undefined)).toBeNull()
    expect(seoDocument({})).toBeNull()
  })
})
