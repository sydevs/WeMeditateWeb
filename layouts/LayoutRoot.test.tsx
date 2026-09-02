/**
 * LayoutRoot is the global passthrough layout: it loads global CSS and wraps the
 * page in the Sentry error boundary, but renders no chrome. Embed routes rely on
 * it rendering children verbatim (bare). Sentry + ErrorFallback are mocked so the
 * test exercises the passthrough, not the error UI.
 *
 * Since #70 it also renders ONE empty `sr-only` live region — the route
 * announcer, which lives here rather than in LayoutChrome so an embed route
 * announces too. The assertion stays a byte-for-byte equality rather than
 * relaxing to `toContain`: "renders no chrome" is the property this file exists
 * to hold, and a `toContain` would let any future addition through unnoticed.
 */
import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'

import { ROUTE_ANNOUNCER_ID } from '../lib/route-announcer'

vi.mock('@sentry/react', () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('../components/molecules', () => ({ ErrorFallback: () => null }))

const { default: LayoutRoot } = await import('./LayoutRoot')

const ANNOUNCER =
  `<div aria-atomic="true" aria-live="polite" class="sr-only" ` +
  `id="${ROUTE_ANNOUNCER_ID}" role="status"></div>`

describe('LayoutRoot', () => {
  it('renders children verbatim, plus the route announcer and nothing else', () => {
    const html = renderToStaticMarkup(<LayoutRoot>bare embed content</LayoutRoot>)

    expect(html).toBe(`bare embed content${ANNOUNCER}`)
  })

  it('renders the announcer EMPTY', () => {
    const html = renderToStaticMarkup(<LayoutRoot>x</LayoutRoot>)

    // It must ship with no text. A live region only announces content inserted
    // after the screen reader began observing it, so seeding it with the first
    // page's title would both say nothing and leave a stale string in the DOM
    // for any reader that walks it.
    expect(html).toContain(`id="${ROUTE_ANNOUNCER_ID}" role="status"></div>`)
  })
})
