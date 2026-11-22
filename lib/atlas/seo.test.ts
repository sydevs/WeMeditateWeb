import { describe, it, expect } from 'vitest'
import { atlasSeo } from './seo'
import { renderSeoHead } from '@/lib/seo/head-html'
import type { AtlasSeoResponse } from '@/types/atlas'

const ORIGIN = 'https://wemeditate.com'

/** A region answer with every head-bearing field populated. */
function regionSeo(overrides: Partial<AtlasSeoResponse> = {}): AtlasSeoResponse {
  return {
    type: 'region',
    id: 5,
    route: '/gb/london',
    locale: 'en',
    title: 'London, United Kingdom',
    description: null,
    canonical: `${ORIGIN}/map/gb/london`,
    alternates: [
      { hreflang: 'en', href: `${ORIGIN}/map/gb/london?locale=en` },
      { hreflang: 'fr', href: `${ORIGIN}/map/gb/london?locale=fr` },
      { hreflang: 'x-default', href: `${ORIGIN}/map/gb/london` },
    ],
    openGraph: {
      'og:type': 'website',
      'og:title': 'London, United Kingdom',
      'og:locale': 'en',
      'og:url': `${ORIGIN}/map/gb/london`,
    },
    jsonLd: '{"@context":"https://schema.org","@graph":[{"@type":"City","name":"London"}]}',
    breadcrumbs: [],
    content: { name: 'London', subtitle: null, level: 'city', events: [], eventCount: 0 },
    ...overrides,
  } as AtlasSeoResponse
}

const render = (seo: AtlasSeoResponse, origin = ORIGIN) => renderSeoHead(atlasSeo(seo), origin)

describe('atlasSeo', () => {
  it('publishes the canonical exactly as the endpoint gave it', () => {
    // Never rebuilt: the ownership walk that produces it lives upstream, and a
    // second implementation here would be free to disagree.
    const html = render(regionSeo())

    expect(html).toContain('rel="canonical"')
    expect(html).toContain(`href="${ORIGIN}/map/gb/london"`)
  })

  it('publishes no canonical when no owner can publish one', () => {
    expect(render(regionSeo({ canonical: null, alternates: [] }))).not.toContain('rel="canonical"')
  })

  it('emits one hreflang row per alternate, x-default included', () => {
    const html = render(regionSeo())

    expect(html).toContain('hreflang="en"')
    expect(html).toContain('hreflang="fr"')
    expect(html).toContain('hreflang="x-default"')
  })

  it('carries the title and description the endpoint wrote, for vike-react to emit', () => {
    // `<title>`, the description, `og:title` and `og:description` are the two
    // vike-react settings, read off this document (lib/seo/head-settings.ts).
    const seo = atlasSeo(regionSeo({ description: 'Classes in London' }))

    expect(seo.title).toBe('London, United Kingdom')
    expect(seo.description).toBe('Classes in London')
  })

  it.each(['og:title', 'og:description'])(
    'leaves %s to those settings, so the tag is not emitted twice',
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
      // The alt has no setting of its own, so it is ours to emit.
      expect(html).toContain('property="og:image:alt"')
    },
  )

  it('emits the share image and the card that promises it', () => {
    // vike-react emitted both from its `image` setting until this document
    // replaced that call. A card promising a large image and carrying none
    // renders as an empty box.
    const html = render(
      regionSeo({ openGraph: { 'og:type': 'website', 'og:image': 'https://img.test/a.jpg' } }),
    )

    expect(html).toContain('<meta property="og:image" content="https://img.test/a.jpg">')
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">')
  })

  it('promises no card where the atlas sends no image', () => {
    expect(render(regionSeo())).not.toContain('twitter:card')
  })

  it('publishes the graph the endpoint serialized, verbatim', () => {
    const html = render(regionSeo())

    expect(html).toContain('application/ld+json')
    expect(html).toContain('{"@context":"https://schema.org"')
    expect(html).not.toContain('&quot;')
  })

  it('refuses a block whose upstream escaping regressed', () => {
    const html = render(regionSeo({ jsonLd: '{"a":"</script><img src=x onerror=alert(1)>"}' }))

    expect(html).not.toContain('application/ld+json')
    expect(html).not.toContain('onerror')
  })

  it('describes the atlas root rather than letting it fall back to the site', () => {
    // #64: `/map` inherited the global site title and emitted no canonical, so
    // the front door of the atlas read to a crawler as a copy of the homepage.
    // French on purpose: the root is the one atlas answer upstream localizes,
    // and its canonical is locale-free all the same.
    const root = regionSeo({
      type: 'root',
      id: null,
      route: '/',
      locale: 'fr',
      title: 'Trouvez un cours de méditation',
      description: 'Des cours gratuits, partout dans le monde.',
      canonical: `${ORIGIN}/map`,
      alternates: [{ hreflang: 'x-default', href: `${ORIGIN}/map` }],
      content: { paragraphs: ['Des bénévoles animent chaque cours.'] },
    } as Partial<AtlasSeoResponse>)
    const seo = atlasSeo(root)

    expect(seo.title).toBe('Trouvez un cours de méditation')
    expect(seo.description).toBe('Des cours gratuits, partout dans le monde.')
    expect(render(root)).toContain(`<link rel="canonical" href="${ORIGIN}/map">`)
  })
})
