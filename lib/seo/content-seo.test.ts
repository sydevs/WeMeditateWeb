import { describe, it, expect } from 'vitest'
import { join } from 'node:path'
import { renderSeoHead } from './head-html'
import type { SeoDocument } from './head'
import type { SeoNode } from './schema'
import type { Image, Meditation, Page, ResolvedLecture } from '@/types/sahajcloud'
import { lectureSeo, meditationSeo, pageSeo, resolveSeoImage, type SeoRoute } from './content-seo'
import { enT } from '@/lib/i18n/i18n'
import type { Track } from '@/lib/media/audio'

import { CF_BASE, CF_PUBLIC_URL } from '@/tests/_helpers/cloudflare-images'
import { pngSize } from '@/tests/_helpers/png'

const ORIGIN = 'https://wemeditate.com'
const SHARE_VARIANT = `${CF_BASE}/width=1024`

/**
 * Fixtures mirror what a real read returns.
 *
 * - An image relationship arrives populated to the fields `IMAGE_POPULATE`
 *   names (`server/sahajcloud/`), spelled `…/<id>/public` as
 *   SahajCloud sends it.
 * - `knowledgePages` arrives as `NavPage[]`, which `NAV_PAGE_SELECT` narrows
 *   to `title`, `slug` and `meta` (`types/sahajcloud.ts`).
 * - `tags` values come from the `Page['tags']` enum in
 *   `types/payload/payload-types.ts`, which `PAGE_SELECT` now requests.
 */
/** A populated upload, narrowed to the fields `IMAGE_POPULATE` returns. */
const CF_IMAGE = {
  url: CF_PUBLIC_URL,
  width: 2000,
  height: 1200,
  alt: 'A photo of the subtle system',
} as unknown as Image

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

/** Rendered as the route serves it, on the host the document names. */
const render = (seo: SeoDocument) =>
  renderSeoHead(seo, seo.canonical ? new URL(seo.canonical).origin : ORIGIN)

/** Every `content` the rendered head carries for one meta key, in order. */
function metaValues(seo: SeoDocument, key: string) {
  return [...render(seo).matchAll(/<meta (?:property|name)="([^"]+)" content="([^"]*)">/g)]
    .filter(([, name]) => name === key)
    .map(([, , content]) => content)
}

/**
 * The `@graph` a document publishes, rendered as the route serves it.
 *
 * The builders here describe their nodes as plain data; Unhead mints the
 * `@id`s and the links between them (`lib/seo/head-html.ts`). Asserting the
 * rendered graph is what keeps these cases about what a crawler reads, rather
 * than about the shape of a descriptor.
 */
function graph(seo: SeoDocument): { '@type': string; [key: string]: unknown }[] {
  const html = render(seo)
  const block = html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/s)?.[1]

  return JSON.parse(block ?? '{}')['@graph'] ?? []
}

const typesIn = (seo: SeoDocument) => graph(seo).map((node) => node['@type'])

/** A lexical tree holding one songs content-index block, tracks already resolved. */
function songsBlock(resolvedTracks: Track[]): Page['content'] {
  return {
    root: {
      children: [
        { type: 'block', fields: { blockType: 'content-index', type: 'songs', resolvedTracks } },
      ],
    },
  } as unknown as Page['content']
}

describe('resolveSeoImage', () => {
  const urlOf = (image: unknown) => resolveSeoImage(ORIGIN, image)?.url

  it('appends a large video variant to a Cloudflare image URL', () => {
    expect(urlOf({ url: `${CF_BASE}/` })).toBe(SHARE_VARIANT)
  })

  it('replaces the /public variant a SahajCloud read returns', () => {
    expect(urlOf({ url: CF_PUBLIC_URL })).toBe(SHARE_VARIANT)
  })

  it('returns a non-Cloudflare URL unchanged', () => {
    const external = 'https://example.com/preview.jpg'

    expect(urlOf({ url: external })).toBe(external)
  })

  it('returns null for a bare id (unpopulated relationship)', () => {
    expect(urlOf(7)).toBeUndefined()
  })

  it('returns null when the image or its url is missing', () => {
    expect(urlOf(null)).toBeUndefined()
    expect(urlOf({})).toBeUndefined()
    expect(urlOf({ url: null })).toBeUndefined()
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
    expect(JSON.stringify(graph(seo))).not.toContain('Home Page')
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
    expect(metaValues(seoFor(), 'og:image')).toEqual([`${ORIGIN}/images/metadata/share.png`])
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

    // The claim is an ImageObject now, not a URL: it carries the render's own
    // geometry and the alt text the editor wrote.
    const webPage = withImage.find((node) => node['@type'] === 'WebPage')

    expect(webPage?.primaryImageOfPage).toMatchObject({
      '@type': 'ImageObject',
      url: SHARE_VARIANT,
      width: 1024,
      caption: 'A photo of the subtle system',
    })
    expect(without.find((node) => node['@type'] === 'WebPage')?.primaryImageOfPage).toBeUndefined()
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
    // The trailing ImageObject is the organization's logo, which Unhead
    // hoists out of the Organization node.
    expect(typesIn(seo)).toEqual(['Organization', 'WebSite', 'WebPage', 'ImageObject'])
    expect(typesIn(seo)).not.toContain('Article')
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

    const person = graph(seo).find((node) => node['@type'] === 'Person')

    expect(person?.name).toBe('Jo Smith')
    expect(article?.author).toEqual({ '@id': person?.['@id'] })
    expect(article?.datePublished).toBe('2026-01-02T03:04:05.000Z')
    expect(article?.dateModified).toBe('2026-01-02T03:04:05.000Z')
  })

  it('names no author where the relationship came back as a bare id', () => {
    // An unpublished author populates as a number. Naming it would publish
    // "3" as the writer.
    const seo = seoFor({ page: page({ author: 3, tags: ['wisdom'] }) })
    const article = graph(seo).find((node) => node['@type'] === 'Article')

    expect(article).toBeDefined()
    // Unhead names the organization as the author of an unattributed article,
    // which is a true claim. What must not exist is a Person built from `3`.
    expect(typesIn(seo)).not.toContain('Person')
  })

  it('trails Home → page for a page the knowledge menu lists, every rung a URL', () => {
    // The menu itself is a heading, not a page, and Google refuses a rung
    // with no `item` anywhere but last.
    const seo = seoFor({ settings: { knowledgePages: [{ slug: 'about' }] } as typeof NO_MENU })
    const trail = graph(seo).find((node) => node['@type'] === 'BreadcrumbList')

    expect(trail?.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'We Meditate', item: `${ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: 'About Meditation', item: `${ORIGIN}/about` },
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

  it('publishes the music library as a playlist of recordings', () => {
    const content = songsBlock([
      {
        url: 'https://audio.test/bhairavi.mp3',
        title: 'Raga Bhairavi',
        credit: 'Nirmal Sangeet',
        creditURL: 'https://artist.test/nirmal',
        thumbnailURL: '',
        duration: 325,
      },
      // No populated album, so no artist, and no length stored upstream.
      {
        url: 'https://audio.test/evening.mp3',
        title: 'Evening',
        credit: '',
        creditURL: '',
        thumbnailURL: '',
        duration: 0,
      },
    ])
    const playlist = graph(seoFor({ page: page({ content }) })).find(
      (node) => node['@type'] === 'MusicPlaylist',
    )

    expect(playlist?.['@id']).toBe(`${ORIGIN}/about#playlist`)
    expect(playlist?.numTracks).toBe(2)
    expect(playlist?.track).toStrictEqual([
      {
        '@type': 'MusicRecording',
        name: 'Raga Bhairavi',
        byArtist: {
          '@type': 'MusicGroup',
          name: 'Nirmal Sangeet',
          url: 'https://artist.test/nirmal',
        },
        duration: 'PT5M25S',
      },
      { '@type': 'MusicRecording', name: 'Evening' },
    ])
  })

  it('refuses an artist link that is not an http URL', () => {
    const content = songsBlock([
      {
        url: 'https://audio.test/bhairavi.mp3',
        title: 'Raga Bhairavi',
        credit: 'Nirmal Sangeet',
        creditURL: 'javascript:alert(1)',
        thumbnailURL: '',
        duration: 0,
      },
    ])
    const playlist = graph(seoFor({ page: page({ content }) })).find(
      (node) => node['@type'] === 'MusicPlaylist',
    )

    expect(playlist?.track).toStrictEqual([
      {
        '@type': 'MusicRecording',
        name: 'Raga Bhairavi',
        byArtist: { '@type': 'MusicGroup', name: 'Nirmal Sangeet' },
      },
    ])
  })

  it('publishes no playlist for a page with no music library', () => {
    expect(typesIn(seoFor())).not.toContain('MusicPlaylist')
  })

  it('publishes nothing at all where the origin is unknown', () => {
    // Outside a Vike app. A guessed canonical is worse than none, and so is
    // a guessed og:url or share image.
    const seo = seoFor({ route: route({ origin: null }) })

    expect(seo.canonical).toBeNull()
    expect(seo.schema).toBeUndefined()
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

    expect(typesIn(seo)).toContain('AudioObject')
    expect(typesIn(seo)).not.toContain('VideoObject')
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
    expect(metaValues(seoFor(), 'og:image')).toEqual([`${ORIGIN}/images/metadata/share.png`])
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

describe("the share image's own geometry and words", () => {
  it('states the render width, the height at the source ratio, and the alt text', () => {
    const seo = seoFor({ page: page({ meta: { image: CF_IMAGE } }) })

    // A flexible variant constrains the width alone, so 2000×1200 renders
    // 1024 wide and keeps its ratio.
    expect(metaValues(seo, 'og:image:width')).toEqual(['1024'])
    expect(metaValues(seo, 'og:image:height')).toEqual(['614'])
    expect(metaValues(seo, 'og:image:alt')).toEqual(['A photo of the subtle system'])
    expect(metaValues(seo, 'twitter:image:alt')).toEqual(['A photo of the subtle system'])
  })

  it('states no geometry for a source narrower than the render', () => {
    // Whether Cloudflare upscales is unverified, so one of two answers is no
    // answer. The alt text is unaffected by that.
    const narrow = { ...CF_IMAGE, width: 600, height: 400 } as typeof CF_IMAGE
    const seo = seoFor({ page: page({ meta: { image: narrow } }) })

    expect(metaValues(seo, 'og:image:width')).toEqual([])
    expect(metaValues(seo, 'og:image:height')).toEqual([])
    expect(metaValues(seo, 'og:image:alt')).toEqual(['A photo of the subtle system'])
  })

  it("states the default asset's own 1.91:1 geometry, and no words for it", () => {
    // The fallback is a file in this repository, so its pixels are known and
    // a consumer lays the card out before it has fetched them. Its alt text
    // would be a literal, and every string the site renders is SahajCloud's.
    expect(metaValues(seoFor(), 'og:image:width')).toEqual(['1200'])
    expect(metaValues(seoFor(), 'og:image:height')).toEqual(['630'])
    expect(metaValues(seoFor(), 'og:image:alt')).toEqual([])
  })

  it('states the geometry the asset on disk actually has', () => {
    const [url] = metaValues(seoFor(), 'og:image')
    const path = join(import.meta.dirname, '../../public', url.slice(ORIGIN.length))

    expect(pngSize(path)).toEqual({ width: 1200, height: 630 })
  })
})

describe("an article's Open Graph namespace", () => {
  const article = () =>
    seoFor({
      page: page({
        author: { id: 3, name: 'Jo Smith', title: 'Writer' } as Page['author'],
        updatedAt: '2026-03-04T05:06:07.000Z',
      }),
    })

  it('names its dates and its author, which a scraper reads without JSON-LD', () => {
    expect(metaValues(article(), 'article:published_time')).toEqual(['2026-01-02T03:04:05.000Z'])
    expect(metaValues(article(), 'article:modified_time')).toEqual(['2026-03-04T05:06:07.000Z'])
    expect(metaValues(article(), 'article:author')).toEqual(['Jo Smith'])
  })

  it('publishes the byline as a Person, with the job title SahajCloud returned', () => {
    const person = graph(article()).find((node) => node['@type'] === 'Person')

    expect(person).toMatchObject({ name: 'Jo Smith', jobTitle: 'Writer' })
  })

  it('names none of them on a standing page', () => {
    expect(metaValues(seoFor(), 'article:published_time')).toEqual([])
    expect(metaValues(seoFor(), 'article:author')).toEqual([])
  })
})

describe('the player a media route advertises', () => {
  const meditation = () =>
    meditationSeo({
      meditation: { id: 105, title: 'Morning', thumbnail: CF_IMAGE } as Meditation,
      route: route({ path: '/meditations/105' }),
    })

  it('upgrades the share card to a playable one, with the dimensions it needs', () => {
    const seo = meditation()

    // A player card with no dimensions falls back to a plain link.
    expect(metaValues(seo, 'twitter:card')).toEqual(['player'])
    expect(metaValues(seo, 'twitter:player')).toEqual([`${ORIGIN}/meditations/105/embed`])
    expect(metaValues(seo, 'twitter:player:width')).toEqual(['560'])
    expect(metaValues(seo, 'twitter:player:height')).toEqual(['315'])
  })

  it('names the same player as og:video, with its type', () => {
    const seo = meditation()

    expect(metaValues(seo, 'og:video')).toEqual([`${ORIGIN}/meditations/105/embed`])
    expect(metaValues(seo, 'og:video:type')).toEqual(['text/html'])
  })

  it('publishes the oEmbed discovery link a paste looks for', () => {
    expect(meditation().links).toEqual([
      {
        rel: 'alternate',
        type: 'application/json+oembed',
        href: `${ORIGIN}/oembed?url=${encodeURIComponent(`${ORIGIN}/meditations/105`)}`,
      },
    ])
  })

  it('publishes none of it on a page, which has no player', () => {
    expect(metaValues(seoFor(), 'twitter:player')).toEqual([])
    expect(metaValues(seoFor(), 'og:video')).toEqual([])
    expect(seoFor().links).toEqual([])
  })
})

describe('the App Store banner', () => {
  it('offers the app on a content route', () => {
    expect(metaValues(seoFor(), 'apple-itunes-app')).toEqual(['app-id=6465684494'])
  })
})

describe('the robots meta every published URL carries', () => {
  it('lets the real site show a large share image in a result', () => {
    expect(metaValues(seoFor(), 'robots')).toEqual(['max-image-preview:large'])
  })

  it.each([
    ['a preview Worker', 'https://claude-feat-273.wemeditate-web.workers.dev'],
    ['the dev server', 'http://localhost:5173'],
  ])('refuses %s, which robots.txt already refuses wholesale', (_label, origin) => {
    expect(metaValues(seoFor({ route: route({ origin }) }), 'robots')).toEqual(['noindex'])
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

  /** The lecture's own media descriptor, which Unhead renders (lib/seo/head-html.ts). */
  const videoNode = (seo: ReturnType<typeof seoFor>) =>
    seo.schema?.nodes.find((node) => node.type === 'video') as
      Extract<SeoNode, { type: 'audio' | 'video' }> | undefined

  it('serves its own name and the video page type', () => {
    const seo = seoFor()

    expect(seo.title).toBe('The subtle system | We Meditate')
    expect(metaValues(seo, 'og:type')).toEqual(['video.other'])
  })

  it('shares its poster, and names the same render in the video node', () => {
    // `resolveLecture` hands back a URL, so the share variant is taken here.
    // A non-Cloudflare poster passes through untouched.
    const seo = seoFor()

    expect(metaValues(seo, 'og:image')).toEqual(['https://video.test/poster.jpg'])
    expect(videoNode(seo)?.thumbnailUrl).toBe('https://video.test/poster.jpg')
  })

  it('resolves a Cloudflare poster to the share variant, as a meditation does', () => {
    const seo = seoFor({ thumbnailUrl: CF_PUBLIC_URL })

    expect(metaValues(seo, 'og:image')).toEqual([SHARE_VARIANT])
  })

  it('plays the whole source, and advertises its embed route as the player', () => {
    const video = videoNode(seoFor())

    expect(video?.durationSeconds).toBe(1800)
    expect(video?.embedUrl).toBe(`${ORIGIN}/lectures/1/embed`)
  })

  it("publishes a clip's own window, the length the page shows", () => {
    expect(videoNode(seoFor({ startTime: 60, stopTime: 150, type: 'clip' }))?.durationSeconds).toBe(
      90,
    )
  })

  it('describes no video at all where the lecture has not synced a name', () => {
    const seo = seoFor({ title: null })

    expect(seo.title).toBe('We Meditate')
    expect(videoNode(seo)).toBeUndefined()
    expect(seo.schema?.nodes.map((node) => node.type)).toEqual(['webPage'])
  })

  it('never publishes an uploadDate, because nothing upstream stores one', () => {
    // `lastSyncedAt` is when we read the lecture, not when it was published.
    expect(graph(seoFor()).find((node) => node['@type'] === 'VideoObject')).not.toHaveProperty(
      'uploadDate',
    )
  })
})
