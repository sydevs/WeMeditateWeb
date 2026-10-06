/**
 * Named without the `+` its subject carries. Vike loads every `+`-prefixed
 * file under `pages/` as a config file, and rejects one that exports no
 * `route` and no `default`. That failure shows up in the build, not the
 * test run. This test still lives next to its subject.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { MapPageData } from './+data'
import type { AtlasSeoResponse } from '../../server/atlas-types'

const pageData: { current: MapPageData } = { current: null as unknown as MapPageData }
const configCalls: Array<Record<string, unknown>> = []

vi.mock('vike-react/useData', () => ({ useData: () => pageData.current }))
vi.mock('vike-react/useConfig', () => ({
  useConfig: () => (config: Record<string, unknown>) => {
    configCalls.push(config)
  },
}))

const { Page } = await import('./+Page')

const seo = {
  type: 'region',
  id: 5,
  route: '/gb/london',
  locale: 'en',
  title: 'London, United Kingdom',
  description: null,
  canonical: 'https://wemeditate.com/map/gb/london',
  alternates: [],
  openGraph: {},
  jsonLd: '{}',
  breadcrumbs: [],
  content: { name: 'London', subtitle: null, level: 'city', events: [], eventCount: 0 },
} as unknown as AtlasSeoResponse

/**
 * The atlas root's answer, mirrored from SahajCloud's
 * `src/endpoints/responseTypes.ts`: `type: 'root'`, `id: null`, and content
 * carrying only paragraphs. Every head-bearing field is localized upstream.
 */
const rootSeo = {
  type: 'root',
  id: null,
  route: '/',
  locale: 'fr',
  title: 'Trouvez un cours de méditation',
  description: 'Des cours gratuits, partout dans le monde.',
  canonical: 'https://wemeditate.com/map',
  alternates: [{ hreflang: 'x-default', href: 'https://wemeditate.com/map' }],
  openGraph: {},
  jsonLd: '{}',
  breadcrumbs: [],
  content: { paragraphs: ['Des bénévoles animent chaque cours.'] },
} as unknown as AtlasSeoResponse

function render(data: Partial<MapPageData>) {
  pageData.current = {
    atlasRoute: '/gb/london',
    seo,
    settings: {} as MapPageData['settings'],
    ...data,
  }

  return renderToStaticMarkup(<Page />)
}

beforeEach(() => {
  configCalls.length = 0
  vi.stubEnv('PUBLIC__SAHAJ_ATLAS_KEY', 'pk_test')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('the atlas page', () => {
  it('renders the content as children of <sahaj-atlas>', () => {
    // The whole architecture: the loader adopts this element, and React's
    // own createRoot replaces its children when the widget mounts. A
    // crawler reads real content in the real document, at the real URL.
    const html = render({})

    expect(html).toMatch(/<sahaj-atlas[^>]*>.*London.*<\/sahaj-atlas>/s)
  })

  it('sizes the element so the widget contains its map instead of taking the viewport', () => {
    // The opt-in for contained map mode (SahajAtlasWeb#170). Without a
    // definite height, the map becomes `position: fixed` over the whole
    // window. The site's sticky nav then paints on top of it.
    const html = render({})
    const tag = html.match(/<sahaj-atlas[^>]*>/)?.[0] ?? ''

    expect(tag).toContain('block')
    // Use `height`, never `min-height`. A min-height box engages
    // containment, but then resolves to zero, and the widget refuses and
    // renders uncontained. The definite value comes from LayoutMap
    // (`h-dvh` column, `flex-1 min-h-0` main), so `h-full` here resolves,
    // instead of falling back to auto.
    expect(tag).toContain('h-full')
    expect(tag).not.toContain('min-h-')
  })

  it('mounts the loader after the element, as a module without async or defer', () => {
    // The loader reads its own script tag for its settings, which async/defer
    // would hide from it.
    const html = render({})

    expect(html).toContain('type="module"')
    expect(html).toContain('https://sahajatlas.com/auto.js?')
    expect(html).not.toContain('async')
    expect(html).not.toContain('defer')
    expect(html.indexOf('</sahaj-atlas>')).toBeLessThan(html.indexOf('auto.js'))
  })

  it('points the widget at this page’s own route', () => {
    expect(render({ atlasRoute: '/nl/amsterdam' })).toContain('atlas=%2Fnl%2Famsterdam')
  })

  it('renders a complete document with no key, just without the upgrade', () => {
    vi.stubEnv('PUBLIC__SAHAJ_ATLAS_KEY', '')

    const html = render({})

    expect(html).not.toContain('auto.js')
    // The indexable half does not depend on the widget.
    expect(html).toContain('London')
  })

  it('still renders the element when there is no server content to put in it', () => {
    // A route whose document we could not read: the widget is what most
    // visitors see, and it fetches its own data.
    const html = render({ seo: null, atlasRoute: '/' })

    expect(html).toMatch(/<sahaj-atlas[^>]*>/)
    expect(html).toContain('auto.js')
  })

  describe('the head', () => {
    it('sets the title from the SEO document', () => {
      render({})

      expect(configCalls[0]).toMatchObject({ title: 'London, United Kingdom' })
    })

    it('passes Head as an array, which vike-react spreads', () => {
      // Regression: `Head` is a cumulative config that vike-react spreads
      // (`...configViaHook.Head ?? []`). A bare element throws "is not
      // iterable", and causes a 500 on every page that has a document. Its
      // own types accept the singular form, so only a runtime render
      // catches this bug.
      render({})

      expect(Array.isArray(configCalls[0].Head)).toBe(true)
    })

    it('contributes nothing when there is no document — a guessed canonical is worse than none', () => {
      render({ seo: null })

      expect(configCalls).toHaveLength(0)
    })

    describe('the atlas root', () => {
      // #64: `/map` used to inherit the global site title and description and
      // emit no canonical, so the front door of the atlas read to a crawler as
      // a duplicate of the homepage.
      it('describes the root view rather than falling back to the site defaults', () => {
        render({ seo: rootSeo, atlasRoute: '/' })

        expect(configCalls[0]).toMatchObject({
          title: 'Trouvez un cours de méditation',
          description: 'Des cours gratuits, partout dans le monde.',
        })
      })

      it('emits a self-referencing canonical for /map', () => {
        render({ seo: rootSeo, atlasRoute: '/' })

        const head = renderToStaticMarkup(<>{configCalls[0].Head as React.ReactNode}</>)

        expect(head).toContain('rel="canonical"')
        expect(head).toContain('href="https://wemeditate.com/map"')
      })

      it('emits no English into a non-English head', () => {
        // Every value is served by the endpoint for `?locale=`, so nothing
        // here is authored in this repo.
        render({ seo: rootSeo, atlasRoute: '/' })

        expect(configCalls[0].title).not.toMatch(/meditation class/i)
      })

      it('describes a bare view route as the root it is a view of', () => {
        render({ seo: rootSeo, atlasRoute: '/search' })

        expect(configCalls[0]).toMatchObject({ title: 'Trouvez un cours de méditation' })
      })
    })
  })
})
