import { describe, it, expect } from 'vitest'
import type { Image, Meditation, Page, ResolvedLecture } from '../server/sahajcloud-types'
import { lectureSeo, meditationSeo, pageSeo, resolveOgImageUrl, type SeoRoute } from './content-seo'
import { enT } from './i18n'

import { CF_BASE, CF_PUBLIC_URL } from '../tests/_helpers/cloudflare-images'

const ORIGIN = 'https://wemeditate.com'
const SHARE_VARIANT = `${CF_BASE}/width=1024`

/**
 * Fixtures mirror what a real read returns.
 *
 * - An image relationship arrives populated to the fields `IMAGE_POPULATE`
 *   names (`server/sahajcloud-client.ts`), spelled `…/<id>/public` as
 *   SahajCloud sends it.
 * - `knowledgePages` arrives as `NavPage[]`, which `NAV_PAGE_SELECT` narrows
 *   to `title`, `slug` and `meta` (`server/sahajcloud-types.ts`).
 * - `tags` values come from the `Page['tags']` enum in
 *   `server/payload-types.ts`, which `PAGE_SELECT` now requests.
 */
/** A populated upload, narrowed to the fields `IMAGE_POPULATE` returns. */
const CF_IMAGE = { url: CF_PUBLIC_URL } as unknown as Image

function route(overrides: Partial<SeoRoute> = {}): SeoRoute {
  return { origin: ORIGIN, path: '/about', locale: 'en', t: enT, ...overrides }
}

function page(overrides: Partial<Page> = {}): Page {
  return {
    id: 1,
    title: 'About Meditation',
    slug: 'about',
    createdAt: '2026-01-02T03:04:05.000Z',
    updatedAt: '2026-01-02T03:04:05.000Z',
    ...overrides,
  } as Page
}

const NO_MENU = { knowledgePages: [] } as unknown as Parameters<typeof pageSeo>[0]['settings']

function seoFor(overrides: Partial<Parameters<typeof pageSeo>[0]> = {}) {
  return pageSeo({
    page: page(),
    settings: NO_MENU,
    route: route(),
    locales: [],
    ...overrides,
  })
}

/** The `[property, content]` values for one Open Graph property. */
function metaValues(seo: { meta: readonly (readonly [string, string])[] }, property: string) {
  return seo.meta.filter(([key]) => key === property).map(([, value]) => value)
}

function graph(seo: { jsonLd: string }): { '@type': string; [key: string]: unknown }[] {
  return JSON.parse(seo.jsonLd)['@graph']
}

const typesIn = (seo: { jsonLd: string }) => graph(seo).map((node) => node['@type'])

describe('resolveOgImageUrl', () => {
  it('appends a large video variant to a Cloudflare image URL', () => {
    expect(resolveOgImageUrl({ url: `${CF_BASE}/` })).toBe(SHARE_VARIANT)
  })

  it('replaces the /public variant a SahajCloud read returns', () => {
    expect(resolveOgImageUrl({ url: CF_PUBLIC_URL })).toBe(SHARE_VARIANT)
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
    expect(resolveOgImageUrl({})).toBeNull()
    expect(resolveOgImageUrl({ url: null })).toBeNull()
  })
})

describe('pageSeo', () => {
  it('composes the title as <page> | We Meditate', () => {
    expect(seoFor().title).toBe('About Meditation | We Meditate')
  })

  it("prefers the page's own meta title over its heading", () => {
    expect(seoFor({ page: page({ meta: { title: 'Why meditate' } }) }).title).toBe(
      'Why meditate | We Meditate',
    )
  })

  it('reverses the form on the home page, whose own name is the site name', () => {
    // `/` is the whole predicate: `normalizeContentPath` maps `/index` to it.
    const seo = seoFor({
      page: page({ meta: { title: 'Guided meditations' } }),
      route: route({ path: '/' }),
    })

    expect(seo.title).toBe('We Meditate | Guided meditations')
  })

  it('falls back to the site tagline on a home page with no meta title', () => {
    expect(seoFor({ route: route({ path: '/' }) }).title).toBe(
      `We Meditate | ${enT('common.general.site_description')}`,
    )
  })

  it('names the home page by its composed title, never by its SahajCloud title', () => {
    // Production's home page is titled `Home Page`, which is an internal name.
    const seo = seoFor({ page: page({ title: 'Home Page' }), route: route({ path: '/' }) })
    const [webPage] = graph(seo).filter((node) => node['@type'] === 'WebPage')

    expect(webPage.name).toBe(seo.title)
    expect(seo.jsonLd).not.toContain('Home Page')
  })

  it('serves a self-referential canonical and og:url', () => {
    const seo = seoFor()

    expect(seo.canonical).toBe(`${ORIGIN}/about`)
    expect(metaValues(seo, 'og:url')).toEqual([`${ORIGIN}/about`])
  })

  it('locale-prefixes the canonical away from English', () => {
    expect(seoFor({ route: route({ locale: 'fr' }) }).canonical).toBe(`${ORIGIN}/fr/about`)
  })

  it('lists exactly the locales the hreflang cluster lists', () => {
    const seo = seoFor({ locales: ['en', 'fr'] })
    const cluster = seo.alternates.map((alternate) => alternate.hreflang)

    expect(metaValues(seo, 'og:locale:alternate')).toEqual(['en', 'fr'])
    expect(cluster.filter((code) => code !== 'x-default')).toEqual(['en', 'fr'])
  })

  it('serves the default share image where the page has none', () => {
    expect(metaValues(seoFor(), 'og:image')).toEqual([`${ORIGIN}/images/metadata/preview.png`])
    expect(metaValues(seoFor(), 'twitter:card')).toEqual(['summary_large_image'])
  })

  it("serves the page's own meta image where it has one", () => {
    const seo = seoFor({ page: page({ meta: { image: CF_IMAGE } }) })

    expect(metaValues(seo, 'og:image')).toEqual([SHARE_VARIANT])
  })

  it('describes the document with its own image, never the site default', () => {
    // og:image takes the default so a share is never blank. The JSON-LD is a
    // claim about this document, so a generic picture would be a false one.
    const withImage = graph(seoFor({ page: page({ meta: { image: CF_IMAGE } }) }))
    const without = graph(seoFor())

    expect(withImage.find((node) => node['@type'] === 'WebPage')?.image).toBe(SHARE_VARIANT)
    expect(without.find((node) => node['@type'] === 'WebPage')?.image).toBeUndefined()
  })

  it('spells a regional locale the Open Graph way, and invents no territory', () => {
    const seo = seoFor({ route: route({ locale: 'pt-BR' }), locales: ['en', 'pt-BR'] })

    expect(metaValues(seo, 'og:locale')).toEqual(['pt_BR'])
    expect(metaValues(seo, 'og:locale:alternate')).toEqual(['en', 'pt_BR'])
  })

  it('names the site and the Twitter account on every page', () => {
    const seo = seoFor()

    expect(metaValues(seo, 'og:site_name')).toEqual(['We Meditate'])
    expect(metaValues(seo, 'twitter:site')).toEqual(['@wemeditate'])
    expect(metaValues(seo, 'og:locale')).toEqual(['en'])
  })

  it("describes the site with the site's own description, never the page's", () => {
    // The WebSite node is a claim about the whole site. One page's summary
    // standing in for it is a worse claim than no description at all.
    const seo = seoFor({ page: page({ meta: { description: 'One page only' } }) })
    const site = graph(seo).find((node) => node['@type'] === 'WebSite')

    expect(site?.description).toBe(enT('common.general.site_description'))
  })

  it('describes a standing page as a website, with Organization and WebSite', () => {
    const seo = seoFor()

    expect(metaValues(seo, 'og:type')).toEqual(['website'])
    expect(typesIn(seo)).toEqual(['Organization', 'WebSite', 'WebPage'])
  })

  it.each([
    ['an author', { author: { id: 3, name: 'Jo Smith' } }],
    ['an article tag', { tags: ['wisdom' as const] }],
  ])('describes a page with %s as an article', (_label, overrides) => {
    const seo = seoFor({ page: page(overrides as Partial<Page>) })

    expect(metaValues(seo, 'og:type')).toEqual(['article'])
    expect(typesIn(seo)).toContain('Article')
  })

  it('publishes the author and the publication date SahajCloud returned', () => {
    const seo = seoFor({ page: page({ author: { id: 3, name: 'Jo Smith' } as Page['author'] }) })
    const article = graph(seo).find((node) => node['@type'] === 'Article')

    expect(article?.author).toEqual({ '@type': 'Person', name: 'Jo Smith' })
    expect(article?.datePublished).toBe('2026-01-02T03:04:05.000Z')
  })

  it('names no author where the relationship came back as a bare id', () => {
    // An unpublished author populates as a number. Naming it would publish
    // "3" as the writer.
    const seo = seoFor({ page: page({ author: 3, tags: ['wisdom'] }) })
    const article = graph(seo).find((node) => node['@type'] === 'Article')

    expect(article).toBeDefined()
    expect(article?.author).toBeUndefined()
  })

  it('trails Home → About Meditation → page for a page the knowledge menu lists', () => {
    const seo = seoFor({ settings: { knowledgePages: [{ slug: 'about' }] } as typeof NO_MENU })
    const trail = graph(seo).find((node) => node['@type'] === 'BreadcrumbList')

    expect(trail?.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'We Meditate', item: `${ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: 'About Meditation' },
      { '@type': 'ListItem', position: 3, name: 'About Meditation' },
    ])
  })

  it('trails nothing for a page the knowledge menu does not list', () => {
    expect(typesIn(seoFor())).not.toContain('BreadcrumbList')
  })

  it('lists the cards a content-index block server-rendered', () => {
    // The shape `contentIndexBlocks` matches: a lexical `block` node whose
    // `fields.blockType` names the block, with `resolvedItems` already
    // attached by `resolveContentIndexBlocks`.
    const content = {
      root: {
        children: [
          {
            type: 'block',
            fields: {
              blockType: 'content-index',
              resolvedItems: [
                { id: 5, title: 'Morning', href: '/meditations/5', thumbnailSrc: '' },
                { id: 6, title: 'Evening', href: '/meditations/6', thumbnailSrc: '' },
              ],
            },
          },
        ],
      },
    } as unknown as Page['content']
    const seo = seoFor({ page: page({ content }) })
    const list = graph(seo).find((node) => node['@type'] === 'ItemList')

    expect(list?.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Morning', url: `${ORIGIN}/meditations/5` },
      { '@type': 'ListItem', position: 2, name: 'Evening', url: `${ORIGIN}/meditations/6` },
    ])
  })

  it('publishes nothing at all where the origin is unknown', () => {
    // Outside a Vike app. A guessed canonical is worse than none, and so is
    // a guessed og:url or share image.
    const seo = seoFor({ route: route({ origin: null }) })

    expect(seo.canonical).toBeNull()
    expect(seo.jsonLd).toBe('')
    expect(metaValues(seo, 'og:url')).toEqual([])
    expect(metaValues(seo, 'og:image')).toEqual([])
  })
})

describe('meditationSeo', () => {
  const meditation = (overrides: Partial<Meditation> = {}): Meditation =>
    ({ id: 105, title: 'Morning meditation', ...overrides }) as Meditation

  const seoFor = (overrides: Partial<Meditation> = {}) =>
    meditationSeo({
      meditation: meditation(overrides),
      route: route({ path: '/meditations/105' }),
    })

  it('serves its own name, not the site name', () => {
    expect(seoFor().title).toBe('Morning meditation | We Meditate')
  })

  it('falls back to the untitled label SahajCloud owns', () => {
    expect(seoFor({ title: null }).title).toBe(
      `${enT('meditation.general.untitled')} | We Meditate`,
    )
  })

  it('describes itself as an AudioObject, with its duration in ISO 8601', () => {
    const seo = seoFor({ durationMinutes: 20, thumbnail: CF_IMAGE })
    const audio = graph(seo).find((node) => node['@type'] === 'AudioObject')

    expect(typesIn(seo)).toEqual(['Organization', 'WebSite', 'AudioObject'])
    expect(audio?.duration).toBe('PT20M')
    expect(audio?.url).toBe(`${ORIGIN}/meditations/105`)
    expect(audio?.thumbnailUrl).toBe(SHARE_VARIANT)
  })

  it('omits the duration where SahajCloud stored none', () => {
    expect(
      graph(seoFor()).find((node) => node['@type'] === 'AudioObject')?.duration,
    ).toBeUndefined()
  })

  it('shares its thumbnail, and the default image where it has none', () => {
    expect(metaValues(seoFor(), 'og:image')).toEqual([`${ORIGIN}/images/metadata/preview.png`])
    expect(metaValues(seoFor({ thumbnail: CF_IMAGE }), 'og:image')).toEqual([
      `${CF_BASE}/width=1024`,
    ])
  })

  it('advertises no translations: meditations carry no per-locale status', () => {
    const seo = seoFor()

    expect(seo.alternates).toEqual([])
    expect(metaValues(seo, 'og:locale:alternate')).toEqual([])
  })
})

describe('lectureSeo', () => {
  const lecture = (overrides: Partial<ResolvedLecture> = {}): ResolvedLecture => ({
    id: 1,
    type: 'full',
    title: 'The subtle system',
    hlsUrl: 'https://video.test/a.m3u8',
    thumbnailUrl: 'https://video.test/poster.jpg',
    duration: 1800,
    startTime: null,
    stopTime: null,
    subtitles: [],
    ...overrides,
  })

  const seoFor = (overrides: Partial<ResolvedLecture> = {}) =>
    lectureSeo({ lecture: lecture(overrides), route: route({ path: '/lectures/1' }) })

  it('serves its own name and the video page type', () => {
    const seo = seoFor()

    expect(seo.title).toBe('The subtle system | We Meditate')
    expect(metaValues(seo, 'og:type')).toEqual(['video.other'])
  })

  it('shares its poster, and names the same render in the VideoObject', () => {
    // `resolveLecture` hands back a URL, so the share variant is taken here.
    // A non-Cloudflare poster passes through untouched.
    const seo = seoFor()
    const video = graph(seo).find((node) => node['@type'] === 'VideoObject')

    expect(metaValues(seo, 'og:image')).toEqual(['https://video.test/poster.jpg'])
    expect(video?.thumbnailUrl).toBe('https://video.test/poster.jpg')
  })

  it('resolves a Cloudflare poster to the share variant, as a meditation does', () => {
    const seo = seoFor({ thumbnailUrl: CF_PUBLIC_URL })

    expect(metaValues(seo, 'og:image')).toEqual([SHARE_VARIANT])
  })

  it('describes itself as a VideoObject playing the whole source', () => {
    const video = graph(seoFor()).find((node) => node['@type'] === 'VideoObject')

    expect(video?.duration).toBe('PT30M')
    expect(video?.url).toBe(`${ORIGIN}/lectures/1`)
  })

  it("publishes a clip's own window, the length the page shows", () => {
    const video = graph(seoFor({ startTime: 60, stopTime: 150, type: 'clip' })).find(
      (node) => node['@type'] === 'VideoObject',
    )

    expect(video?.duration).toBe('PT1M30S')
  })

  it('describes no video at all where the lecture has not synced a name', () => {
    const seo = seoFor({ title: null })

    expect(seo.title).toBe('We Meditate')
    expect(typesIn(seo)).toEqual(['Organization', 'WebSite'])
  })

  it('never publishes an uploadDate, because nothing upstream stores one', () => {
    // `lastSyncedAt` is when we read the lecture, not when it was published.
    expect(
      graph(seoFor()).find((node) => node['@type'] === 'VideoObject')?.uploadDate,
    ).toBeUndefined()
  })
})
