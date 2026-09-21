/**
 * Proves an atlas page keeps the visitor's locale in its own link graph.
 *
 * The sibling suite renders without a `pageContext`, so every href there is
 * the origin-unknown fallback. Only a rendered locale distinguishes "carries
 * `/fr`" from "still emits the English canonical", and the canonical branch
 * is the normal case — a rung's `url` is populated far more often than not.
 *
 * It lives in its own file because the `pageContext` mock is module-wide.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { AtlasSeoResponse } from '../../../server/atlas-types'

const ORIGIN = 'https://wemeditate.com'

// `urlParsed.origin` carries no trailing slash — `lib/head.tsx` concatenates
// it with a path to build the canonical, and would emit `//map` otherwise.
vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => ({ locale: 'fr', urlParsed: { origin: ORIGIN } }),
}))

const { AtlasContent, atlasHref } = await import('./AtlasContent')

/**
 * A region page whose rungs and cards carry the canonical spellings the
 * endpoint really returns, and one rung deep enough to be a link. The final
 * rung is the current page, which never links.
 */
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
    expect(render(regionSeo())).toContain(`href="/fr/map/gb"`)
  })

  it('points an event card at the French spelling of our own canonical', () => {
    expect(render(regionSeo())).toContain(`href="/fr/map/gb/london/1204"`)
  })

  it('emits no English href for a URL it just relativized', () => {
    const html = render(regionSeo())

    expect(html).not.toContain(`href="${ORIGIN}/map/gb"`)
    expect(html).not.toContain(`href="${ORIGIN}/map/gb/london/1204"`)
  })

  it('leaves a canonical owned by another domain exactly as it is', () => {
    // Ownership is per-subtree. That URL is another site's to spell.
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

describe('atlasHref against a known origin', () => {
  it('relativizes a canonical this site serves', () => {
    expect(atlasHref({ route: '/gb', url: `${ORIGIN}/map/gb` }, ORIGIN)).toBe('/map/gb')
  })

  it('keeps a canonical on another origin absolute', () => {
    expect(atlasHref({ route: '/gb', url: 'https://other.org/gb' }, ORIGIN)).toBe(
      'https://other.org/gb',
    )
  })

  it('keeps the query and fragment a canonical carries', () => {
    // The atlas spells a locale as `?locale=`, so a canonical may arrive
    // with a query on it. Dropping it would change which document is meant.
    expect(atlasHref({ route: '/gb', url: `${ORIGIN}/map/gb?locale=fr#events` }, ORIGIN)).toBe(
      '/map/gb?locale=fr#events',
    )
  })

  it('leaves the canonical alone when the origin is unknown', () => {
    expect(atlasHref({ route: '/gb', url: `${ORIGIN}/map/gb` }, null)).toBe(`${ORIGIN}/map/gb`)
  })

  it('still falls back to the /map path, which Link then prefixes', () => {
    expect(atlasHref({ route: '/gb', url: null }, ORIGIN)).toBe('/map/gb')
  })
})
