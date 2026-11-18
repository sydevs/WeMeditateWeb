/**
 * Smoke specs for the share metadata and JSON-LD every content route serves,
 * against the deployed Cloudflare preview.
 *
 * The unit guard proves a built document reaches the markup. Only the
 * preview proves the route built one from real SahajCloud content, through
 * the real data hooks — a page, a meditation and a lecture each reach
 * `lib/content-seo.ts` by a different path.
 *
 * ⚠ `og:url` on the indexable host cannot be checked here: a preview serves
 * its own `workers.dev` origin, and the canonical is the request origin by
 * design. sydevs/WeMeditateWeb#160's post-switch check covers that.
 */
import { describe, it, expect } from 'vitest'
import { fetchPage, discoverFromSahajCloud, type PageResult } from '../_helpers/preview'

/** Every `content` value for one `og:`/`twitter:` property, in document order. */
function metaContent(html: string, property: string): string[] {
  return [...html.matchAll(/<meta[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => tag.includes(`property="${property}"`))
    .map((tag) => tag.match(/content="([^"]*)"/)?.[1] ?? '')
}

/** A URL without its trailing slash, so `https://host/` and `https://host` compare equal. */
const bare = (url: string) => url.replace(/\/$/, '')

/** Every JSON-LD block on the page, parsed. */
function jsonLdBlocks(html: string): { '@graph'?: { '@type': string }[] }[] {
  return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((match) =>
    JSON.parse(match[1]),
  )
}

const titleOf = (html: string) => html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ''

/** The assertions every content route owes, whatever it serves. */
function expectShareable(page: PageResult, path: string) {
  const origin = new URL(page.finalUrl).origin
  const [ogUrl] = metaContent(page.html, 'og:url')
  const [ogImage] = metaContent(page.html, 'og:image')

  expect(ogUrl && bare(ogUrl), `${path} should name its own URL as og:url`).toBe(
    bare(page.finalUrl),
  )
  expect(ogUrl, `${path} og:url should be on the host that served it`).toContain(origin)
  expect(metaContent(page.html, 'og:site_name')[0], `${path} should name the site`).toBeTruthy()
  expect(metaContent(page.html, 'og:type')[0], `${path} should declare a page type`).toBeTruthy()
  expect(metaContent(page.html, 'og:locale')[0], `${path} should declare its locale`).toBeTruthy()
  expect(ogImage, `${path} should carry a share image`).toMatch(/^https?:\/\//)
  expect(
    metaContent(page.html, 'twitter:card')[0],
    `${path} should declare a Twitter card beside its image`,
  ).toBe('summary_large_image')

  const graphs = jsonLdBlocks(page.html)

  expect(graphs.length, `${path} should carry JSON-LD`).toBeGreaterThan(0)

  const types = graphs.flatMap((graph) => graph['@graph'] ?? []).map((node) => node['@type'])

  expect(types, `${path} should describe the organisation`).toContain('Organization')
  expect(types, `${path} should describe the site`).toContain('WebSite')
}

describe('web preview share metadata', () => {
  it('the homepage is shareable and describes itself', async () => {
    const home = await fetchPage('/')

    expectShareable(home, '/')
    expect(titleOf(home.html), 'the home page takes the site title form').toMatch(
      /^We Meditate \| .+/,
    )
  })

  it('a SahajCloud page is shareable and describes itself as a WebPage', async (ctx) => {
    const slug = (await discoverFromSahajCloud())?.pageSlug

    ctx.skip(!slug, 'no SahajCloud page slug; set the SAHAJCLOUD_API_KEY secret')

    const page = await fetchPage(`/${slug}`)

    expectShareable(page, `/${slug}`)

    const types = jsonLdBlocks(page.html)
      .flatMap((graph) => graph['@graph'] ?? [])
      .map((node) => node['@type'])

    expect(types).toContain('WebPage')
    expect(titleOf(page.html), 'a content page is named before the site').toMatch(
      / \| We Meditate$/,
    )
  })

  it('a meditation is shareable and names itself, not the site', async (ctx) => {
    const id = (await discoverFromSahajCloud())?.meditationId

    ctx.skip(!id, 'no SahajCloud meditation; set the SAHAJCLOUD_API_KEY secret')

    const page = await fetchPage(`/meditations/${id}`)

    expectShareable(page, `/meditations/${id}`)
    // The bug this ticket closes: every meditation served the site default.
    expect(titleOf(page.html), 'a meditation should carry its own name').not.toBe('We Meditate')

    const types = jsonLdBlocks(page.html)
      .flatMap((graph) => graph['@graph'] ?? [])
      .map((node) => node['@type'])

    expect(types).toContain('AudioObject')
  })

  it('a lecture is shareable and describes its video', async (ctx) => {
    const id = (await discoverFromSahajCloud())?.lectureId

    ctx.skip(!id, 'no SahajCloud lecture; set the SAHAJCLOUD_API_KEY secret')

    const page = await fetchPage(`/lectures/${id}`)

    expectShareable(page, `/lectures/${id}`)
    expect(metaContent(page.html, 'og:type')[0]).toBe('video.other')

    const types = jsonLdBlocks(page.html)
      .flatMap((graph) => graph['@graph'] ?? [])
      .map((node) => node['@type'])

    expect(types).toContain('VideoObject')
  })

  it('an embed route publishes no URL claim at all', async (ctx) => {
    const id = (await discoverFromSahajCloud())?.meditationId

    ctx.skip(!id, 'no SahajCloud meditation; set the SAHAJCLOUD_API_KEY secret')

    const embed = await fetchPage(`/meditations/${id}/embed`)

    // An iframe target is not a URL to point a crawler at.
    expect(metaContent(embed.html, 'og:url')).toEqual([])
    expect(embed.html).not.toContain('rel="canonical"')
    expect(embed.html).not.toContain('application/ld+json')
  })
})
