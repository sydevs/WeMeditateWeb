/**
 * Regression test: an incomplete WebConfig (e.g. missing featuredPages) must NOT
 * crash the layout. It previously threw via assertSettingsConfigured() outside the
 * error boundary, which surfaced as a 500 on every rendered page (incl. the homepage).
 *
 * Heavy organism/Sentry imports are mocked so the test exercises LayoutDefault's
 * own settings handling, not the full component tree.
 */
import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'

const ctx: { settings: unknown } = { settings: undefined }

vi.mock('vike-react/useData', () => ({ useData: () => ({ settings: ctx.settings }) }))
vi.mock('vike-react/usePageContext', () => ({ usePageContext: () => ({ locale: 'en' }) }))
vi.mock('@sentry/react', () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('../components/molecules', () => ({ ErrorFallback: () => null }))
vi.mock('../components/organisms/Header', () => ({
  Header: ({ navItems }: { navItems: { label: string }[] }) => (
    <nav>{navItems.map((n) => n.label).join(',')}</nav>
  ),
}))
vi.mock('../components/organisms/Footer', () => ({ Footer: () => <footer /> }))

const { default: LayoutDefault } = await import('./LayoutDefault')

describe('LayoutDefault', () => {
  it('renders only children when settings are absent (error-page path)', () => {
    ctx.settings = undefined
    const html = renderToStaticMarkup(<LayoutDefault>page content</LayoutDefault>)

    expect(html).toContain('page content')
  })

  it('does not throw when featuredPages/homePage are missing', () => {
    // The old assertSettingsConfigured() threw here → unhandled SSR error → 500.
    ctx.settings = { classPages: [], knowledgePages: [], infoPages: [] }
    expect(() => renderToStaticMarkup(<LayoutDefault>page content</LayoutDefault>)).not.toThrow()
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
    const html = renderToStaticMarkup(<LayoutDefault>page content</LayoutDefault>)

    expect(html).toContain('About')
    expect(html).toContain('Contact')
  })
})
