/**
 * What a content page renders after its own content: the discover section on
 * the home page, and the share row everywhere else — sharing the very URL the
 * route's own `seo` document publishes as canonical, and never under a live
 * preview.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import type { LivePreviewState } from '@/lib/live-preview/protocol'
import type { Locale, Page, WebConfig } from '@/types/sahajcloud'
import { EN_TRANSLATIONS, enT } from '@/lib/i18n/i18n'
import { pageSeo, seoRoute } from '@/lib/seo/content-seo'
import { renderSeoHead } from '@/lib/seo/head-html'
import { anchorFor } from '@/tests/_helpers/markup'

const routeData: { current: unknown } = { current: {} }
const context: {
  current: {
    locale: Locale
    urlPathname: string
    livePreview?: LivePreviewState
    urlParsed?: { origin: string | null }
  }
} = { current: { locale: 'en', urlPathname: '/' } }

vi.mock('vike-react/useData', () => ({ useData: () => routeData.current }))
vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => ({
    urlParsed: { origin: 'https://wemeditate.com' },
    ...context.current,
    translations: EN_TRANSLATIONS,
  }),
}))
vi.mock('vike-react/useConfig', () => ({ useConfig: () => () => {} }))
vi.mock('vike-react/ClientOnly', () => ({
  ClientOnly: ({ fallback }: { fallback?: ReactNode }) => fallback ?? null,
}))

const { Page } = await import('./+Page')

const content = {
  root: {
    type: 'root',
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    children: [
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'text',
            text: 'Sit, and notice.',
            version: 1,
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
          },
        ],
      },
    ],
  },
}

const page = (slug: string, title: string) =>
  ({
    id: slug.length + 1,
    slug,
    title,
    content,
    author: null,
    featuredVideo: null,
    meta: null,
  }) as unknown as Page

/** Upstream leaves the home page's slug blank; `/` serves it. */
const HOME = page('', 'We Meditate')
const ARTICLE = page('about-meditation', 'About Meditation')

const settings = {
  homePage: { slug: '' },
  availableLocales: ['en', 'fr'],
  featuredPages: [],
  featuredArticles: [],
  knowledgePages: [],
  infoPages: [],
  classPages: [
    { id: 11, slug: 'classes-near-me', title: 'Classes Near Me' },
    { id: 14, slug: 'live-meditations', title: 'Live Meditations' },
  ],
} as unknown as WebConfig

const FACEBOOK = 'https://www.facebook.com/sharer/sharer.php?u='
const ORIGIN = 'https://wemeditate.com'

/**
 * The route's data, built by the very builder `+data.ts` calls, so the row
 * and the head cannot be compared against two different documents.
 */
function routeSeo(document: Page, pageContext: (typeof context)['current']) {
  return pageSeo({
    page: document,
    settings,
    locales: [],
    route: seoRoute(
      {
        urlParsed: pageContext.urlParsed ?? { origin: ORIGIN },
        urlPathname: pageContext.urlPathname,
        locale: pageContext.locale,
      },
      enT,
    ),
  })
}

function render(document: Page, pageContext: (typeof context)['current']) {
  routeData.current = {
    page: document,
    settings,
    // The route param, as `+data.ts` returns it: `/` arrives as `index`.
    slug: pageContext.urlPathname.split('/').pop(),
    seo: routeSeo(document, pageContext),
  }
  context.current = pageContext

  return renderToStaticMarkup(<Page />)
}

beforeEach(() => {
  context.current = { locale: 'en', urlPathname: '/' }
})

describe('the end of a content page', () => {
  it('closes the home page with one discover action per configured class page', () => {
    const html = render(HOME, { locale: 'en', urlPathname: '/index' })

    expect(html).toContain(EN_TRANSLATIONS.discover.general.title)
    expect(anchorFor(html, '/classes-near-me')).not.toBe('')
    expect(anchorFor(html, '/live-meditations')).not.toBe('')
    expect(html).not.toContain(FACEBOOK)
  })

  it('shares any other page at the canonical its head publishes, under its title', () => {
    const at: (typeof context)['current'] = { locale: 'fr', urlPathname: '/about-meditation' }
    const html = render(ARTICLE, at)
    const canonical = `${ORIGIN}/fr/about-meditation`

    expect(renderSeoHead(routeSeo(ARTICLE, at), ORIGIN)).toContain(
      `<link rel="canonical" href="${canonical}">`,
    )
    expect(anchorFor(html, `${FACEBOOK}${encodeURIComponent(canonical)}`)).not.toBe('')
    expect(html).toContain(`text=${encodeURIComponent('About Meditation')}%20`)
    expect(html).not.toContain(EN_TRANSLATIONS.discover.general.title)
  })

  it('renders the same markup in the browser, whose pageContext carries no origin', () => {
    // Hydration must reproduce the server's markup or React discards it, so
    // the row may not read anything the two renders disagree about. `seo` is
    // built once on the server and rides `data`; the browser's own `urlParsed`
    // carries no origin.
    const at: (typeof context)['current'] = { locale: 'en', urlPathname: '/about-meditation' }
    const server = render(ARTICLE, at)

    context.current = { ...at, urlParsed: { origin: null } }

    expect(server).toContain(FACEBOOK)
    expect(renderToStaticMarkup(<Page />)).toBe(server)
  })

  it('offers no share row under an open live preview', () => {
    const preview: (typeof context)['current'] = {
      locale: 'en',
      urlPathname: '/about-meditation',
    }
    const html = render(ARTICLE, {
      ...preview,
      livePreview: { active: true, scope: 'wm-web-config' },
    })

    expect(html).toContain('Sit, and notice.')
    expect(html).not.toContain(FACEBOOK)
    expect(render(ARTICLE, preview)).toContain(FACEBOOK)
  })
})
