/**
 * LayoutRoot is the global passthrough layout: it loads global CSS and wraps the
 * page in the Sentry error boundary, but renders no chrome. Embed routes rely on
 * it rendering children verbatim (bare). Sentry + ErrorFallback are mocked so the
 * test exercises the passthrough, not the error UI.
 */
import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'

vi.mock('@sentry/react', () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('../components/molecules', () => ({ ErrorFallback: () => null }))

const { default: LayoutRoot } = await import('./LayoutRoot')

describe('LayoutRoot', () => {
  it('renders children verbatim with no chrome (bare)', () => {
    const html = renderToStaticMarkup(<LayoutRoot>bare embed content</LayoutRoot>)

    expect(html).toBe('bare embed content')
  })
})
