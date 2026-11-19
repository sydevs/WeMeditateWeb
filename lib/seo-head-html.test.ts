import { describe, it, expect } from 'vitest'
import { lectureSeo, pageSeo, seoRoute } from './content-seo'
import { renderSeoHead, seoHeadHtml } from './seo-head-html'
import { enT } from './i18n'
import type { Page, ResolvedLecture } from '../server/sahajcloud-types'
import type { SeoHead } from './head'
import { buildAlternates } from './hreflang'
import { CF_PUBLIC_URL } from '../tests/_helpers/cloudflare-images'

const ORIGIN = 'https://wemeditate.com'

const LECTURE: ResolvedLecture = {
  id: 163,
  type: 'full',
  title: 'Interview with Shri Mataji',
  hlsUrl: 'https://video.test/a.m3u8',
  thumbnailUrl: CF_PUBLIC_URL,
  duration: 1170,
  startTime: null,
  stopTime: null,
  subtitles: [],
}

function document(lecture: ResolvedLecture = LECTURE) {
  return lectureSeo({
    lecture,
    route: seoRoute(
      { urlParsed: { origin: ORIGIN }, urlPathname: '/lectures/163', locale: 'en' },
      enT,
    ),
  })
}

function head(lecture: ResolvedLecture = LECTURE): string {
  const seo = document(lecture)

  if (!seo.schema) {
    throw new Error('the lecture document carries no schema descriptors')
  }

  return renderSeoHead({ ...seo, schema: seo.schema }, ORIGIN)
}

function graph(html: string): Record<string, unknown>[] {
  const match = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)

  if (!match) {
    throw new Error(`no JSON-LD block in:\n${html}`)
  }

  return (JSON.parse(match[1]) as { '@graph': Record<string, unknown>[] })['@graph']
}

const nodeOf = (html: string, type: string) => graph(html).find((node) => node['@type'] === type)

/** A `/:slug` document, for the claims that are a page's rather than a lecture's. */
function pageDocument(path: string) {
  return pageSeo({
    page: { id: 1, title: 'About', slug: 'about', createdAt: 'x', updatedAt: 'x' } as Page,
    settings: { knowledgePages: [] } as unknown as Parameters<typeof pageSeo>[0]['settings'],
    route: seoRoute({ urlParsed: { origin: ORIGIN }, urlPathname: path, locale: 'en' }, enT),
    locales: [],
  })
}

describe('renderSeoHead', () => {
  it('emits one JSON-LD block, and the document serializes none of its own', () => {
    const html = head()

    expect(document().jsonLd).toBe('')
    expect(html.match(/application\/ld\+json/g)).toHaveLength(1)
    expect(graph(html).length).toBeGreaterThan(1)
  })

  it('duplicates nothing vike-react already writes', () => {
    const html = head()

    expect(html).not.toContain('charset')
    expect(html).not.toContain('name="viewport"')
    expect(html).not.toContain('<title')
    expect(html).not.toContain('name="description"')
  })

  it('links the graph: a WebPage inside the WebSite, published by the Organization', () => {
    const html = head()
    const webPage = nodeOf(html, 'WebPage')
    const webSite = nodeOf(html, 'WebSite')
    const organization = nodeOf(html, 'Organization')

    expect(webPage?.isPartOf).toEqual({ '@id': webSite?.['@id'] })
    expect(webSite?.publisher).toEqual({ '@id': organization?.['@id'] })
    expect(webPage?.inLanguage).toBe('en')
  })

  it('advertises the embed route as the video player', () => {
    expect(nodeOf(head(), 'VideoObject')?.embedUrl).toBe(`${ORIGIN}/lectures/163/embed`)
  })

  it('names the lecture, its poster and its playback duration', () => {
    const video = nodeOf(head(), 'VideoObject')

    expect(video?.name).toBe('Interview with Shri Mataji')
    expect(video?.duration).toBe('PT19M30S')
    expect(String(video?.thumbnailUrl)).toContain('imagedelivery.net')
  })

  it('omits uploadDate, because nothing upstream records one', () => {
    expect(nodeOf(head(), 'VideoObject')).not.toHaveProperty('uploadDate')
  })

  it('claims no page image where the document has none of its own', () => {
    expect(nodeOf(head(), 'WebPage')).not.toHaveProperty('primaryImageOfPage')
  })

  it('emits a WebPage but no VideoObject for a lecture that has not synced', () => {
    const html = head({ ...LECTURE, title: null })

    expect(nodeOf(html, 'WebPage')).toBeDefined()
    expect(nodeOf(html, 'VideoObject')).toBeUndefined()
  })

  it('carries the canonical and the Open Graph the route built', () => {
    const html = head()

    expect(html).toContain(`<link rel="canonical" href="${ORIGIN}/lectures/163">`)
    expect(html).toContain('<meta property="og:type" content="video.other">')
    expect(html).toContain('<meta name="twitter:site" content="@wemeditate">')
  })
})

describe('seoHeadHtml', () => {
  const context = (overrides: Record<string, unknown>) =>
    ({
      urlParsed: { origin: ORIGIN },
      urlPathname: '/lectures/163',
      locale: 'en',
      data: { seo: document() },
      ...overrides,
    }) as unknown as Parameters<typeof seoHeadHtml>[0]

  it('publishes nothing under a live preview', () => {
    expect(seoHeadHtml(context({ livePreview: { active: true } }))).toBe('')
  })

  it('publishes nothing for a route that built no document', () => {
    expect(seoHeadHtml(context({ data: {} }))).toBe('')
  })

  it('publishes the head for a content route', () => {
    expect(seoHeadHtml(context({}))).toContain('application/ld+json')
  })
})

describe('the claims Unhead would invent, and does not', () => {
  it('types a page at /about as a WebPage, never an AboutPage', () => {
    // Unhead reads a subtype off the URL. The slug is the editor's to change,
    // so the type is pinned instead.
    const seo = pageDocument('/about')
    const html = renderSeoHead({ ...seo, schema: seo.schema! }, ORIGIN)

    expect(nodeOf(html, 'WebPage')).toBeDefined()
    expect(html).not.toContain('AboutPage')
  })

  it('names the page as the main entity of its own media', () => {
    const html = head()

    expect(nodeOf(html, 'WebPage')?.mainEntity).toEqual({
      '@id': `${ORIGIN}/lectures/163#video`,
    })
    expect(nodeOf(html, 'VideoObject')?.['@id']).toBe(`${ORIGIN}/lectures/163#video`)
  })
})


/** A head with nothing but the tags under test, so each one stands alone. */
function bare(overrides: Partial<SeoHead> = {}): SeoHead {
  return {
    canonical: `${ORIGIN}/about`,
    alternates: [],
    meta: [],
    jsonLd: '',
    ...overrides,
  }
}

describe('the tags around the graph', () => {
  const cluster = (locales: Parameters<typeof buildAlternates>[0]['locales']) =>
    renderSeoHead(
      bare({ alternates: buildAlternates({ origin: ORIGIN, path: '/about', locales }) }),
      ORIGIN,
    )

  it('emits the canonical alone where there is no cluster', () => {
    // A meditation or a lecture carries no per-locale publish state. It still
    // needs a canonical — and an hreflang cluster whose members are not
    // self-canonical is one Google discards, so these ship together.
    const html = cluster([])

    expect(html).toContain('rel="canonical"')
    expect(html).toContain(`href="${ORIGIN}/about"`)
    expect(html).not.toContain('rel="alternate"')
  })

  it('omits the canonical entirely where the route publishes none', () => {
    expect(renderSeoHead(bare({ canonical: null }), ORIGIN)).not.toContain('rel="canonical"')
  })

  it('emits one alternate per advertised locale, plus x-default', () => {
    const html = cluster(['en', 'fr'])

    expect(html).toContain(`<link rel="alternate" hreflang="en" href="${ORIGIN}/about">`)
    expect(html).toContain(`<link rel="alternate" hreflang="fr" href="${ORIGIN}/fr/about">`)
    expect(html).toContain(`<link rel="alternate" hreflang="x-default" href="${ORIGIN}/about">`)
  })

  it('spells the attribute lowercase, for crawlers that pattern-match', () => {
    const html = cluster(['en'])

    expect(html).toContain('hreflang=')
    expect(html).not.toContain('hrefLang=')
  })

  it('emits every meta pair it is given, repeats included', () => {
    // `og:locale:alternate` is the reason `meta` is a list and not a record.
    const html = renderSeoHead(
      bare({
        meta: [
          ['og:locale:alternate', 'fr'],
          ['og:locale:alternate', 'de'],
        ],
      }),
      ORIGIN,
    )

    expect(html).toContain('<meta property="og:locale:alternate" content="fr">')
    expect(html).toContain('<meta property="og:locale:alternate" content="de">')
  })
})

describe('a graph that arrives already serialized', () => {
  // `/map`'s, built upstream where the ownership walk that mints its ids is.
  it('emits the block verbatim, unescaped', () => {
    const html = renderSeoHead(
      bare({ jsonLd: '{"@context":"https://schema.org","@graph":[{"@type":"City"}]}' }),
      ORIGIN,
    )

    expect(html).toContain('application/ld+json')
    // Not HTML-escaped: `&quot;` here would be invalid JSON-LD.
    expect(html).toContain('{"@context":"https://schema.org"')
    expect(html).not.toContain('&quot;')
    expect(graph(html)[0]).toEqual({ '@type': 'City' })
  })

  it('leaves an upstream escape alone rather than turning it back into a tag', () => {
    const html = renderSeoHead(
      bare({ jsonLd: '{"name":"\\u003c/script\\u003ealert(1)"}' }),
      ORIGIN,
    )

    expect(html).toContain('\\u003c/script\\u003e')
    expect(html).not.toContain('</script>alert(1)')
  })

  it.each([
    ['a raw closing script tag', '{"name":"</script><img src=x onerror=alert(1)>"}'],
    ['a raw comment opener', '{"name":"<!--"}'],
  ])('drops the block entirely on %s', (_label, jsonLd) => {
    // Fail closed. Reaching here means a producer's escaping regressed. A page
    // that is merely less richly described beats one that executes CMS text.
    const html = renderSeoHead(bare({ jsonLd }), ORIGIN)

    expect(html).not.toContain('application/ld+json')
    expect(html).not.toContain('onerror')
  })
})
