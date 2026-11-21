/**
 * Every content route publishes a complete head, and the generator that
 * renders it is declared exactly once.
 */
import { describe, it, expect } from 'vitest'
import { relative } from 'node:path'
import type { Meditation, Page, ResolvedLecture } from '../../server/sahajcloud-types'
import { lectureSeo, meditationSeo, pageSeo } from '../../lib/content-seo'
import type { SeoDocument } from '../../lib/head'
import { renderSeoHead } from '../../lib/seo-head-html'
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
  // Through the one generator the site declares, so what this guard reads is
  // the markup the Worker serves.
  const html = renderSeoHead(seo, ORIGIN)

  it('names its own URL, as a canonical and as og:url', () => {
    expect(html).toContain(`rel="canonical"`)
    expect(html).toContain(`<meta property="og:url" content="${seo.canonical}">`)
  })

  it('carries a share image', () => {
    // 59 of 66 production pages have no image of their own, so a route that
    // depends on one would share nothing at all.
    expect(html).toContain('property="og:image"')
    // Twitter keys on `name`, Open Graph on `property`.
    expect(html).toContain('name="twitter:card"')
  })

  it('carries JSON-LD that parses, describing the organisation and the site', () => {
    const block = html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/s)?.[1]

    expect(block, 'every content route emits a JSON-LD block').toBeTruthy()

    const parsed = JSON.parse(block!) as { '@graph': { '@type': string }[] }
    const types = parsed['@graph'].map((node) => node['@type'])

    expect(types).toContain('Organization')
    expect(types).toContain('WebSite')
  })

  it('leaves no unescaped < inside the JSON-LD block', () => {
    const block =
      html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/s)?.[1] ?? ''

    expect(block).not.toContain('<')
  })
})

describe('the generated head', () => {
  const declaring = sourceFiles(['pages/**/+config.ts'])
    .filter((file) => stripComments(readSource(file)).includes('headHtmlEnd'))
    .map((file) => relative(repoRoot, file))

  // `headHtmlEnd` is global as well as cumulative, so a declaration on one
  // route adds a second copy of the whole head to every page of the site.
  // Three route declarations served three canonicals, three `robots` metas
  // and three `@graph` blocks on the deployed preview (#282).
  it('is declared once, in the root config', () => {
    expect(declaring).toEqual(['pages/+config.ts'])
  })
})
