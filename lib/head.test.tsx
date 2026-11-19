import { readFile } from 'node:fs/promises'
import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ContentHead, ContentHeadTags, resolveOgImageUrl } from './head'
import { buildAlternates } from './hreflang'

const context = vi.hoisted(() => ({ pageContext: {} as Record<string, unknown> }))

vi.mock('../hooks/usePageContext', () => ({
  useOptionalPageContext: () => context.pageContext,
}))

vi.mock('vike-react/useConfig', () => ({ useConfig: () => () => undefined }))

const CF_URL = 'https://imagedelivery.net/acct/abc123/'

describe('resolveOgImageUrl', () => {
  it('appends a large video variant to a Cloudflare image URL', () => {
    expect(resolveOgImageUrl({ url: CF_URL })).toBe(`${CF_URL}width=1024`)
  })

  it('replaces the /public variant a SahajCloud read returns', () => {
    expect(resolveOgImageUrl({ url: `${CF_URL}public` })).toBe(`${CF_URL}width=1024`)
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
    expect(resolveOgImageUrl(undefined)).toBeNull()
    expect(resolveOgImageUrl({})).toBeNull()
    expect(resolveOgImageUrl({ url: null })).toBeNull()
  })
})

describe('ContentHeadTags', () => {
  const ORIGIN = 'https://wemeditate.com'
  const cluster = (locales: Parameters<typeof buildAlternates>[0]['locales']) =>
    renderToStaticMarkup(
      <ContentHeadTags
        alternates={buildAlternates({ origin: ORIGIN, path: '/about', locales })}
        canonical={`${ORIGIN}/about`}
      />,
    )

  it('emits the canonical alone where there is no cluster', () => {
    // A meditation or a lecture carries no per-locale publish state. It
    // still needs a canonical — and an hreflang cluster whose members are
    // not self-canonical is one Google discards, so these ship together.
    const html = cluster([])

    expect(html).toContain('<link href="https://wemeditate.com/about" rel="canonical"/>')
    expect(html).not.toContain('rel="alternate"')
  })

  it('emits one alternate per advertised locale, plus x-default', () => {
    const html = cluster(['en', 'fr'])

    expect(html).toContain('<link rel="alternate" hreflang="en" href="https://wemeditate.com/about"/>')
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

})

/**
 * The class-directory block changes the page's address as a visitor browses
 * it: the widget writes `?atlas=` and `?locale=` through `pushState`. None of
 * that may reach the `<head>`, or a search engine would see more than one page
 * per address.
 *
 * This holds by construction — `ContentHead` builds the canonical from
 * `urlPathname`, which carries no query string — and that is exactly why it is
 * pinned here rather than left to a reader to notice.
 */
describe('ContentHead, under a class-directory block', () => {
  const ORIGIN = 'https://wemeditate.com'

  function headFor(search: Record<string, string>) {
    context.pageContext = {
      urlParsed: { origin: ORIGIN, search },
      urlPathname: '/live',
      locale: 'en',
      data: { alternateLocales: ['en', 'ru'] },
    }

    return renderToStaticMarkup(<ContentHead />)
  }

  it('renders the same canonical and cluster with and without the widget parameters', () => {
    const bare = headFor({})

    expect(bare).toContain('<link href="https://wemeditate.com/live" rel="canonical"/>')
    expect(bare).toContain('hreflang="ru"')
    expect(headFor({ atlas: '/gb/london', locale: 'ru' })).toBe(bare)
  })

  it('imports no head helper into either new block', async () => {
    // `getAtlasSeo` emits the atlas's own canonical at `/map` for every route,
    // which is right for a host owning its route and wrong for a page that
    // merely carries the widget. `useConfig` is the other one to stay away
    // from: sydevs/WeMeditateWeb#273 moves the head onto `unhead` behind
    // `data.seo`, and a block reaching for it would move with it.
    const blocks = [
      '../components/organisms/ClassDirectory/ClassDirectory.tsx',
      '../components/molecules/LiveSession/LiveSession.tsx',
    ]

    for (const block of blocks) {
      const source = await readFile(new URL(block, import.meta.url), 'utf8')
      const imports = source.match(/^import .*$/gm)?.join('\n') ?? ''

      expect(imports.length).toBeGreaterThan(0)
      expect(imports).not.toMatch(/atlas-head|useConfig/)
    }
  })
})
