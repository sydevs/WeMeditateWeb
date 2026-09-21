/**
 * Proves an atlas page keeps the visitor's locale in its own link graph.
 *
 * The sibling suite renders with no `pageContext`, so every href there is the
 * origin-unknown fallback. Only a rendered locale separates "carries `/fr`"
 * from "still emits the English canonical", and the canonical branch is the
 * normal case — a rung's `url` is populated far more often than not.
 *
 * `vi.mock` is module-wide, so the locale moves through a mutable holder, as
 * in `layouts/LayoutChrome.test.tsx`.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { AtlasSeoResponse } from '../../../server/atlas-types'

const ORIGIN = 'https://wemeditate.com'

const ctx: { locale: string } = { locale: 'fr' }

vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => ({ locale: ctx.locale, urlParsed: { origin: ORIGIN } }),
}))

const { AtlasContent, atlasHref } = await import('./AtlasContent')

function regionSeo(overrides: Record<string, unknown> = {}): AtlasSeoResponse {
  return {
    type: 'region',
    id: 5,
    route: '/gb/london',
    locale: 'fr',
    title: 'Londres, Royaume-Uni',
    description: null,
    canonical: `${ORIGIN}/map/gb/london`,
    alternates: [],
    openGraph: {},
    jsonLd: '{}',
    breadcrumbs: [
      { name: 'Royaume-Uni', route: '/gb', url: `${ORIGIN}/map/gb` },
      { name: 'Londres', route: '/gb/london', url: `${ORIGIN}/map/gb/london` },
    ],
    content: {
      name: 'Londres',
      subtitle: 'Grand Londres',
      level: 'city',
      events: [
        {
          id: 1204,
          route: '/gb/london/1204',
          url: `${ORIGIN}/map/gb/london/1204`,
          title: 'Méditation du samedi matin',
          schedule: 'Toutes les semaines le samedi à 9:30',
          address: '12 rue Beethoven, Londres',
          online: false,
        },
      ],
      eventCount: 1,
    },
    ...overrides,
  } as AtlasSeoResponse
}

const render = (seo: AtlasSeoResponse) => renderToStaticMarkup(<AtlasContent seo={seo} />)

describe('an atlas page in a non-English locale', () => {
  it('points a breadcrumb rung at the French spelling of our own canonical', () => {
    ctx.locale = 'fr'

    expect(render(regionSeo())).toContain(`href="/fr/map/gb"`)
  })

  it('points an event card at the French spelling of our own canonical', () => {
    ctx.locale = 'fr'

    expect(render(regionSeo())).toContain(`href="/fr/map/gb/london/1204"`)
  })

  it('leaves a canonical owned by another domain exactly as it is', () => {
    // Ownership is per-subtree. That URL is another site's to spell.
    ctx.locale = 'fr'
    const html = render(
      regionSeo({
        breadcrumbs: [
          { name: 'Royaume-Uni', route: '/gb', url: 'https://other.org/classes/gb' },
          { name: 'Londres', route: '/gb/london', url: `${ORIGIN}/map/gb/london` },
        ],
      }),
    )

    expect(html).toContain(`href="https://other.org/classes/gb"`)
    expect(html).not.toContain(`href="/fr/classes/gb"`)
  })

  it('locale-prefixes the fallback path when no canonical can be published', () => {
    ctx.locale = 'fr'
    const html = render(
      regionSeo({
        breadcrumbs: [
          { name: 'Royaume-Uni', route: '/gb', url: null },
          { name: 'Londres', route: '/gb/london', url: null },
        ],
      }),
    )

    expect(html).toContain(`href="/fr/map/gb"`)
  })
})

describe('an atlas page in English', () => {
  it('links a rung and a card bare, never through an /en redirect', () => {
    // English is served bare, so `/en/map/gb` is a URL that 301s.
    ctx.locale = 'en'
    const html = render(regionSeo())

    expect(html).toContain(`href="/map/gb"`)
    expect(html).toContain(`href="/map/gb/london/1204"`)
    expect(html).not.toContain('/en/map/')
  })
})

describe('atlasHref', () => {
  it('relativizes a canonical this site serves, for `Link` to prefix', () => {
    expect(atlasHref({ route: '/gb', url: `${ORIGIN}/map/gb` }, ORIGIN)).toBe('/map/gb')
  })

  it('leaves the canonical alone when the origin is unknown', () => {
    expect(atlasHref({ route: '/gb', url: `${ORIGIN}/map/gb` }, null)).toBe(`${ORIGIN}/map/gb`)
  })
})
