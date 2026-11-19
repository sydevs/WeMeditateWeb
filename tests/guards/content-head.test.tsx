/**
 * Every content route publishes a complete head.
 *
 * Two halves, because two different things can break. The rendered half
 * checks that a built document reaches the markup as the tags a crawler and a
 * social scraper look for. The source half checks that a route which claims
 * to be an indexable content URL actually builds one — the failure a renderer
 * test cannot see, because a route with no `seo` on its data renders a head
 * that is merely empty.
 */
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { dirname, join, relative } from 'node:path'
import type { Meditation, Page, ResolvedLecture } from '../../server/sahajcloud-types'
import { lectureSeo, meditationSeo, pageSeo } from '../../lib/content-seo'
import { SeoHeadTags, type SeoDocument } from '../../lib/head'
import { enT } from '../../lib/i18n'
import { readSource, repoRoot, sourceFiles, stripComments } from './_source-scan'

const ORIGIN = 'https://wemeditate.com'
const route = (path: string) => ({ origin: ORIGIN, path, locale: 'en' as const, t: enT })

/**
 * One document per content type, built by the same functions the routes
 * call. A type added to the site without a row here is the gap this guard
 * exists to leave visible.
 */
const DOCUMENTS: [string, SeoDocument][] = [
  [
    'a page',
    pageSeo({
      page: {
        id: 1,
        title: 'About',
        slug: 'about',
        createdAt: '2026-01-02T03:04:05.000Z',
        updatedAt: '2026-01-02T03:04:05.000Z',
      } as Page,
      settings: { knowledgePages: [] } as unknown as Parameters<typeof pageSeo>[0]['settings'],
      route: route('/about'),
      locales: ['en'],
    }),
  ],
  [
    'a meditation',
    meditationSeo({
      meditation: { id: 105, title: 'Morning' } as Meditation,
      route: route('/meditations/105'),
    }),
  ],
  [
    'a lecture',
    lectureSeo({
      lecture: {
        id: 1,
        type: 'full',
        title: 'The subtle system',
        hlsUrl: 'https://video.test/a.m3u8',
        thumbnailUrl: null,
        duration: 600,
        startTime: null,
        stopTime: null,
        subtitles: [],
      } satisfies ResolvedLecture,
      route: route('/lectures/1'),
    }),
  ],
]

describe.each(DOCUMENTS)('the head %s publishes', (_label, seo) => {
  const html = renderToStaticMarkup(<SeoHeadTags seo={seo} />)

  it('names its own URL, as a canonical and as og:url', () => {
    expect(html).toContain(`rel="canonical"`)
    expect(html).toContain(`<meta content="${seo.canonical}" property="og:url"/>`)
  })

  it('carries a share image', () => {
    // 59 of 66 production pages have no image of their own, so a route that
    // depends on one would share nothing at all.
    expect(html).toContain('property="og:image"')
    // Twitter keys on `name`, Open Graph on `property`.
    expect(html).toContain('name="twitter:card"')
  })

  it('carries JSON-LD that parses, describing the organisation and the site', () => {
    // A route whose head Unhead generates carries its graph as descriptors
    // instead; `lib/seo-head-html.test.ts` renders and asserts that one.
    if (seo.schema) {
      expect(seo.schema.nodes.length).toBeGreaterThan(0)

      return
    }

    const block = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1]

    expect(block, 'every content route emits a JSON-LD block').toBeTruthy()

    const parsed = JSON.parse(block!) as { '@graph': { '@type': string }[] }
    const types = parsed['@graph'].map((node) => node['@type'])

    expect(types).toContain('Organization')
    expect(types).toContain('WebSite')
  })

  it('leaves no unescaped < inside the JSON-LD block', () => {
    const block = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1] ?? ''

    expect(block).not.toContain('<')
  })
})

describe('every route that declares a content head', () => {
  // Two mechanisms, one requirement. `Head: ContentHead` renders the document
  // the route's data carries; `headHtmlEnd: seoHeadHtml` generates it with
  // Unhead. Either way the route owes a document, and a route that declares
  // the head and builds none emits nothing at all, which no rendered test
  // can catch.
  const HEAD_DECLARATIONS = ['Head: ContentHead', 'headHtmlEnd: seoHeadHtml']
  const configs = sourceFiles(['pages/**/+config.ts']).filter((file) => {
    const source = stripComments(readSource(file))

    return HEAD_DECLARATIONS.some((declaration) => source.includes(declaration))
  })

  it('is a list this guard actually found', () => {
    // An empty list would pass every assertion below without reading a file.
    expect(configs.length).toBeGreaterThan(0)
  })

  it.each(configs.map((file) => relative(repoRoot, file)))(
    '%s builds a seo document in its +data.ts',
    (config) => {
      const data = join(repoRoot, dirname(config), '+data.ts')

      expect(stripComments(readSource(data))).toMatch(/\bseo:\s*\w+Seo\(/)
    },
  )
})
