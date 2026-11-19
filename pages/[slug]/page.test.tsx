/**
 * What a content page renders after its own content: the discover section on
 * the home page, and the share row everywhere else — sharing the very URL
 * `ContentHead` names as canonical, and never under a live preview.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import type { LivePreviewState } from '../../lib/live-preview/protocol'
import type { Page, WebConfig } from '../../server/sahajcloud-types'
import { EN_TRANSLATIONS } from '../../lib/i18n'
import { anchorFor, openTag } from '../../tests/_helpers/markup'

const routeData: { current: unknown } = { current: {} }
const context: {
  current: {
    locale: string
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
const { ContentHead } = await import('../../lib/head')

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

function render(document: Page, pageContext: (typeof context)['current']) {
  routeData.current = { page: document, settings }
  context.current = pageContext

  return renderToStaticMarkup(<Page />)
}

beforeEach(() => {
  context.current = { locale: 'en', urlPathname: '/' }
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('the end of a content page', () => {
  it('closes the home page with one discover action per configured class page', () => {
    const html = render(HOME, { locale: 'en', urlPathname: '/index' })

    expect(html).toContain(EN_TRANSLATIONS.discover.general.title)
    expect(anchorFor(html, '/classes-near-me')).not.toBe('')
    expect(anchorFor(html, '/live-meditations')).not.toBe('')
    expect(html).not.toContain(FACEBOOK)
  })

  it('shares any other page at the canonical ContentHead emits, under its title', () => {
    const at = { locale: 'fr', urlPathname: '/about-meditation' }
    const html = render(ARTICLE, at)
    const canonical = 'https://wemeditate.com/fr/about-meditation'

    expect(openTag(renderToStaticMarkup(<ContentHead />), 'link')).toContain(`href="${canonical}"`)
    expect(anchorFor(html, `${FACEBOOK}${encodeURIComponent(canonical)}`)).not.toBe('')
    expect(html).toContain(`text=${encodeURIComponent('About Meditation')}%20`)
    expect(html).not.toContain(EN_TRANSLATIONS.discover.general.title)
  })

  it('renders the same row in the browser, whose pageContext parses a path-only URL', () => {
    // What the server rendered is what hydration must reproduce, or React
    // discards the server markup.
    vi.stubGlobal('window', { location: { origin: 'https://wemeditate.com' } })
    const html = render(ARTICLE, {
      locale: 'en',
      urlPathname: '/about-meditation',
      urlParsed: { origin: null },
    })

    expect(
      anchorFor(
        html,
        `${FACEBOOK}${encodeURIComponent('https://wemeditate.com/about-meditation')}`,
      ),
    ).not.toBe('')
  })

  it('offers no share row under an open live preview', () => {
    const preview = { locale: 'en', urlPathname: '/about-meditation' }
    const html = render(ARTICLE, {
      ...preview,
      livePreview: { active: true, scope: 'wm-web-config' },
    })

    expect(html).toContain('Sit, and notice.')
    expect(html).not.toContain(FACEBOOK)
    expect(render(ARTICLE, preview)).toContain(FACEBOOK)
  })
})
