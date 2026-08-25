import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { AtlasHeadTags, isSafeJsonLd } from './atlas-head'
import type { AtlasSeoResponse } from '../server/atlas-types'

/** A region answer with every head-bearing field populated. */
function regionSeo(overrides: Partial<AtlasSeoResponse> = {}): AtlasSeoResponse {
  return {
    type: 'region',
    id: 5,
    route: '/gb/london',
    locale: 'en',
    title: 'London, United Kingdom',
    description: null,
    canonical: 'https://wemeditate.com/map/gb/london',
    alternates: [
      { hreflang: 'en', href: 'https://wemeditate.com/map/gb/london?locale=en' },
      { hreflang: 'fr', href: 'https://wemeditate.com/map/gb/london?locale=fr' },
      { hreflang: 'x-default', href: 'https://wemeditate.com/map/gb/london' },
    ],
    openGraph: {
      'og:type': 'website',
      'og:title': 'London, United Kingdom',
      'og:locale': 'en',
      'og:url': 'https://wemeditate.com/map/gb/london',
    },
    jsonLd: '{"@context":"https://schema.org","@graph":[{"@type":"City","name":"London"}]}',
    breadcrumbs: [],
    content: { name: 'London', subtitle: null, level: 'city', events: [], eventCount: 0 },
    ...overrides,
  } as AtlasSeoResponse
}

const render = (seo: AtlasSeoResponse) => renderToStaticMarkup(<AtlasHeadTags seo={seo} />)

describe('AtlasHeadTags', () => {
  it('emits the canonical exactly as the endpoint gave it', () => {
    // Never rebuilt: the ownership walk that produces it lives upstream, and a
    // second implementation here would be free to disagree.
    expect(render(regionSeo())).toContain(
      '<link rel="canonical" href="https://wemeditate.com/map/gb/london"/>',
    )
  })

  it('omits the canonical entirely when no owner can publish one', () => {
    const html = render(regionSeo({ canonical: null, alternates: [] }))

    expect(html).not.toContain('rel="canonical"')
  })

  it('emits one hreflang row per alternate, x-default included', () => {
    const html = render(regionSeo())

    expect(html).toContain('hreflang="en"')
    expect(html).toContain('hreflang="fr"')
    expect(html).toContain('hreflang="x-default"')
  })

  describe('Open Graph', () => {
    it('emits the properties vike-react does not generate itself', () => {
      const html = render(regionSeo())

      expect(html).toContain('<meta property="og:type" content="website"/>')
      expect(html).toContain('<meta property="og:locale" content="en"/>')
      expect(html).toContain('<meta property="og:url"')
    })

    it.each(['og:title', 'og:description', 'og:image'])(
      'leaves %s to the config, so the tag is not emitted twice',
      (property) => {
        const html = render(
          regionSeo({
            openGraph: {
              'og:type': 'website',
              'og:title': 'London',
              'og:description': 'Classes in London',
              'og:image': 'https://img.test/a.jpg',
              'og:image:alt': 'A class',
            },
          }),
        )

        expect(html).not.toContain(`property="${property}"`)
        // The alt has no config equivalent, so it is ours to emit.
        expect(html).toContain('property="og:image:alt"')
      },
    )
  })

  describe('the JSON-LD block', () => {
    it('emits the pre-serialized string verbatim, unescaped', () => {
      const html = render(regionSeo())

      expect(html).toContain('<script type="application/ld+json">')
      // Not HTML-escaped: `&quot;` here would be invalid JSON-LD.
      expect(html).toContain('{"@context":"https://schema.org"')
      expect(html).not.toContain('&quot;')
    })

    it('emits upstream-escaped markup without turning it back into a tag', () => {
      // What `jsonLdEscape()` produces for a CMS description containing
      // `</script>` — the escape must survive to the page unchanged.
      const html = render(
        regionSeo({ jsonLd: '{"name":"\\u003c/script\\u003ealert(1)"}' }),
      )

      expect(html).toContain('\\u003c/script\\u003e')
      expect(html).not.toContain('</script>alert(1)')
    })

    it.each([
      ['a raw closing script tag', '{"name":"</script><img src=x onerror=alert(1)>"}'],
      ['a raw comment opener', '{"name":"<!--"}'],
    ])('drops the block entirely on %s', (_label, jsonLd) => {
      // Fail closed. Reaching here means upstream escaping regressed; a page
      // that is merely less richly described beats one that executes CMS text.
      const html = render(regionSeo({ jsonLd }))

      expect(html).not.toContain('application/ld+json')
      expect(html).not.toContain('onerror')
    })
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
