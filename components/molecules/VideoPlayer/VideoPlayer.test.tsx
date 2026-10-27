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
import { posterURL } from './poster'

// The shape a SahajCloud read sends: `…/<image_id>/public`
// (sydevs/SahajCloud `src/plugins/storage/cloudflareImagesAdapter.ts:203`).
const CF_PUBLIC_URL = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123/public'
const BASE = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123'

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

describe('VideoPlayer poster variant', () => {
  // The poster was the one `imagedelivery.net` URL in the server document
  // that still asked for no variant, so it served the original (#146).
  it('requests the 1024px video width in the SSR fallback', () => {
    const html = renderToStaticMarkup(
      <VideoPlayer hlsUrl="https://cdn.example.com/v.m3u8" poster={CF_PUBLIC_URL} />,
    )

    expect(html).toContain(`src="${BASE}/width=1024"`)
    expect(html).not.toContain('/public')
  })

  // Vidstack needs browser media APIs, so its `poster` cannot be asserted
  // through SSR. Both branches call this one function instead.
  it('resolves one width for both branches, and passes other URLs through', () => {
    expect(posterURL(CF_PUBLIC_URL)).toBe(`${BASE}/width=1024`)
    expect(posterURL('/api/videos/file/v.jpg')).toBe('/api/videos/file/v.jpg')
    expect(posterURL(undefined)).toBeUndefined()
  })

  it.each([
    ['a story placeholder', 'https://picsum.photos/seed/talk/1024/576'],
    ['the SahajCloud dev fallback', '/api/videos/file/talk.jpg'],
  ])('leaves %s unchanged in the fallback', (_label, poster) => {
    const html = renderToStaticMarkup(
      <VideoPlayer hlsUrl="https://cdn.example.com/v.m3u8" poster={poster} />,
    )

    expect(html).toContain(`src="${poster}"`)
  })
})
