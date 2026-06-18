/**
 * Regression test: an incomplete WebConfig (e.g. missing featuredPages) must NOT
 * crash the layout. It previously threw via assertSettingsConfigured() outside the
 * error boundary, which surfaced as a 500 on every rendered page (incl. the homepage).
 *
 * Heavy organism imports are mocked so the test exercises LayoutChrome's own
 * settings handling, not the full component tree.
 */
import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const ctx: { settings: unknown } = { settings: undefined }

vi.mock('vike-react/useData', () => ({ useData: () => ({ settings: ctx.settings }) }))
vi.mock('vike-react/usePageContext', () => ({ usePageContext: () => ({ locale: 'en' }) }))
vi.mock('../components/organisms/Header', () => ({
  Header: ({ navItems }: { navItems: { label: string; dropdown?: unknown }[] }) => (
    <nav>{navItems.map((n) => `${n.label}${n.dropdown ? '[dropdown]' : ''}`).join(',')}</nav>
  ),
}))
vi.mock('../components/organisms/Footer', () => ({ Footer: () => <footer /> }))

const { default: LayoutChrome } = await import('./LayoutChrome')

describe('LayoutChrome', () => {
  it('renders only children when settings are absent (error-page / CMS-down path)', () => {
    ctx.settings = undefined
    const html = renderToStaticMarkup(<LayoutChrome>page content</LayoutChrome>)

    expect(html).toContain('page content')
    // No chrome when settings are unavailable.
    expect(html).not.toContain('<nav>')
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

  it('gives only the last nav item a knowledge dropdown when knowledge pages exist', () => {
    ctx.settings = {
      featuredPages: [
        { title: 'Meditate', slug: 'meditate' },
        { title: 'About', slug: 'about' },
      ],
      knowledgePages: [{ title: 'Kundalini', slug: 'kundalini' }],
      featuredArticles: [{ title: 'History', slug: 'history', meta: { image: { url: 'x' } } }],
      classPages: [],
      infoPages: [],
    }
    const html = renderToStaticMarkup(<LayoutChrome>page content</LayoutChrome>)

    expect(html).toContain('About[dropdown]')
    // Earlier items stay plain links.
    expect(html).toContain('Meditate,')
    expect(html).not.toContain('Meditate[dropdown]')
  })

  it('leaves the last nav item a plain link when there are no knowledge pages', () => {
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
