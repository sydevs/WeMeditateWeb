/**
 * Regression test: an incomplete WebConfig (for example, missing
 * featuredPages) must not crash the layout. It previously threw through
 * assertSettingsConfigured() outside the error boundary, which surfaced as
 * a 500 on every rendered page, including the homepage.
 *
 * Heavy organism imports are mocked, so the test exercises LayoutChrome's
 * own settings handling, not the full component tree.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { EN_TRANSLATIONS } from '../lib/i18n'

const ctx: { settings: unknown; page: unknown } = { settings: undefined, page: undefined }

vi.mock('vike-react/useData', () => ({
  useData: () => ({ settings: ctx.settings, page: ctx.page }),
}))
vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => ({ locale: 'en', urlPathname: '/index', translations: EN_TRANSLATIONS }),
}))
vi.mock('../components/organisms/Header', () => ({
  // Stands in for Header's fragment: the banner, then the sticky nav. Both
  // carry what the layout hands them, because where the nav sits and what band
  // it is given are LayoutChrome's own contract (#204).
  Header: ({
    navItems,
    bandClassName,
  }: {
    navItems: { label: string; dropdown?: unknown }[]
    bandClassName?: string
  }) => (
    <>
      <header className={bandClassName} />
      <nav className="sticky top-0">
        {navItems.map((n) => `${n.label}${n.dropdown ? '[dropdown]' : ''}`).join(',')}
      </nav>
    </>
  ),
}))
vi.mock('../components/organisms/Footer', () => ({
  Footer: ({ languages }: { languages: { code: string; href: string }[] }) => (
    <footer>{languages.map((l) => `${l.code}:${l.href}`).join(',')}</footer>
  ),
}))

const { default: LayoutChrome } = await import('./LayoutChrome')

/**
 * Open `<div>`s enclosing the sticky nav. A sticky element travels only inside
 * its containing block, so this count is what decides how far the nav can go:
 * 1 is the page column alone, and anything more is a box that releases it.
 */
function wrappersAroundNav(html: string): number {
  const before = html.slice(0, html.indexOf('<nav'))

  return (before.match(/<div/g) ?? []).length - (before.match(/<\/div>/g) ?? []).length
}

const splashPage = {
  content: {
    root: { children: [{ type: 'block', fields: { blockType: 'splash', textColor: 'light' } }] },
  },
}

const navSettings = {
  featuredPages: [{ title: 'About', slug: 'about' }],
  knowledgePages: [],
  featuredArticles: [],
  classPages: [],
  infoPages: [],
}

describe('LayoutChrome', () => {
  beforeEach(() => {
    ctx.page = undefined
  })

  it('renders only children when settings are absent (error-page / SahajCloud-down path)', () => {
    ctx.settings = undefined
    const html = renderToStaticMarkup(<LayoutChrome>page content</LayoutChrome>)

    expect(html).toContain('page content')
    // No chrome when settings are unavailable.
    expect(html).not.toContain('<nav')
    expect(html).not.toContain('<footer')
  })

  it('does not throw when featuredPages/homePage are missing', () => {
    // The old assertSettingsConfigured() threw here → unhandled SSR error → 500.
    ctx.settings = { classPages: [], knowledgePages: [], infoPages: [] }
    expect(() => renderToStaticMarkup(<LayoutChrome>page content</LayoutChrome>)).not.toThrow()
  })

  it('builds navigation from featuredPages when configured', () => {
    ctx.settings = {
      featuredPages: [
        { title: 'About', slug: 'about' },
        { title: 'Contact', slug: 'contact' },
      ],
      classPages: [],
      knowledgePages: [],
      infoPages: [],
    }
    const html = renderToStaticMarkup(<LayoutChrome>page content</LayoutChrome>)

    expect(html).toContain('About')
    expect(html).toContain('Contact')
  })

  it('appends a separate link-less knowledge dropdown item (featured links stay plain)', () => {
    ctx.settings = {
      featuredPages: [
        { title: 'Meditate', slug: 'meditate' },
        { title: 'Music', slug: 'music' },
      ],
      // The dropdown item is labelled from the first knowledge page (interim).
      knowledgePages: [{ title: 'About Meditation', slug: 'about-meditation' }],
      featuredArticles: [{ title: 'History', slug: 'history', meta: { image: { url: 'x' } } }],
      classPages: [],
      infoPages: [],
    }
    const html = renderToStaticMarkup(<LayoutChrome>page content</LayoutChrome>)

    // The appended item carries the dropdown...
    expect(html).toContain('About Meditation[dropdown]')
    // ...and the featured pages remain plain links (no dropdown attached).
    expect(html).toContain('Meditate,')
    expect(html).not.toContain('Meditate[dropdown]')
    expect(html).not.toContain('Music[dropdown]')
  })

  it('hands the language dropdown the raw pathname, for Link to spell', () => {
    // `/index` is routing-internal, and the dropdown hands it on as written:
    // `Link` is what resolves it, to `/` for English and `/fr` for French.
    ctx.settings = {
      availableLocales: ['en', 'fr'],
      featuredPages: [],
      knowledgePages: [],
      featuredArticles: [],
      classPages: [],
      infoPages: [],
    }
    const html = renderToStaticMarkup(<LayoutChrome>page content</LayoutChrome>)

    expect(html).toContain('en:/index,fr:/index')
  })

  describe('the sticky nav', () => {
    // Measured in Chromium at 1200px of scroll: `top` was -1153 without a lead
    // splash and -1107 with one, at 390px and at 1280px. The nav never reached
    // the state its compact bar, its fade and its sentinel all exist for (#204).
    it('hangs off the page column, so it has the page to pin against', () => {
      ctx.settings = navSettings

      expect(wrappersAroundNav(renderToStaticMarkup(<LayoutChrome>c</LayoutChrome>))).toBe(1)
    })

    it('keeps that much room inside the lead-splash overlay', () => {
      // The overlay spans the whole column, not the header, so the nav inside
      // it still has the page to travel.
      ctx.settings = navSettings
      ctx.page = splashPage
      const html = renderToStaticMarkup(<LayoutChrome>c</LayoutChrome>)

      expect(wrappersAroundNav(html)).toBe(2)
      expect(html).toContain('class="pointer-events-none absolute inset-0 z-30"')
    })

    it('hands the header the page band a wrapper used to give it', () => {
      ctx.settings = navSettings
      ctx.page = splashPage

      expect(renderToStaticMarkup(<LayoutChrome>c</LayoutChrome>)).toContain(
        '<header class="max-w-7xl mx-auto px-6 w-full surface-dark"',
      )
    })
  })

  it('omits the dropdown item entirely when there are no knowledge pages', () => {
    ctx.settings = {
      featuredPages: [{ title: 'About', slug: 'about' }],
      knowledgePages: [],
      featuredArticles: [],
      classPages: [],
      infoPages: [],
    }
    const html = renderToStaticMarkup(<LayoutChrome>page content</LayoutChrome>)

    expect(html).toContain('About')
    expect(html).not.toContain('[dropdown]')
  })
})
