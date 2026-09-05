import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'

// The player is wrapped in vike-react's ClientOnly: server-side it renders
// only the poster fallback, because the implementation, Vidstack and
// hls.js, is browser-only. Stub ClientOnly to its fallback, to assert that
// SSR-and-CLS contract here. Ladle verifies the interactive Vidstack layer
// (controls, captions menu, clip timeline, teal theming) visually, not at
// the markup level.
vi.mock('vike-react/ClientOnly', () => ({
  ClientOnly: ({ fallback }: { fallback?: ReactNode }) => fallback ?? null,
}))

import { VideoPlayer } from './index'

describe('<VideoPlayer> server-side fallback', () => {
  it('renders the poster as the fallback frame (LCP image, no player JS)', () => {
    const html = renderToStaticMarkup(
      <VideoPlayer
        hlsUrl="https://cdn.example.com/v.m3u8"
        poster="https://img.example.com/p.jpg"
        title="A talk"
      />,
    )

    expect(html).toContain('src="https://img.example.com/p.jpg"')
    // The Vidstack player itself must not render on the server.
    expect(html).not.toContain('media-player')
  })

  it('falls back to an aspect-video placeholder when there is no poster', () => {
    const html = renderToStaticMarkup(<VideoPlayer hlsUrl="https://cdn.example.com/v.m3u8" />)

    expect(html).toContain('aspect-video')
    expect(html).not.toContain('<img')
  })

  it('renders nothing when hlsUrl is empty', () => {
    expect(renderToStaticMarkup(<VideoPlayer hlsUrl="" />)).toBe('')
  })
})

describe('VideoPlayer implementation (browser-only)', () => {
  it('imports server-safe and renders nothing without an hlsUrl', async () => {
    // Importing the impl pulls in @vidstack/react. This test checks that it
    // resolves in a non-DOM environment, and that the empty-source guard
    // returns before any player mounts. It uses a dynamic import, so a
    // resolution failure stays isolated to this test.
    const { VideoPlayer: Impl } = await import('./VideoPlayer')

    expect(typeof Impl).toBe('function')
    expect(renderToStaticMarkup(<Impl hlsUrl="" />)).toBe('')
  })
})
