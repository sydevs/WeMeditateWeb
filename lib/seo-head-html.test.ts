import { describe, it, expect } from 'vitest'
import { lectureSeo, seoRoute } from './content-seo'
import { renderSeoHead, seoHeadHtml } from './seo-head-html'
import { enT } from './i18n'
import type { ResolvedLecture } from '../server/sahajcloud-types'
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
