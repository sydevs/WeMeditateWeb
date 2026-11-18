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
import { BOUNDED_POSTER_SIZES, posterSrcSet, posterURL } from './poster'
import { CF_BASE, CF_PUBLIC_URL } from '../../../tests/_helpers/cloudflare-images'

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
    // Eager, so React 19 hoists its preload link: this is the only poster in
    // the server HTML, and the route's LCP image (#152).
    expect(html).toContain('loading="eager"')
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

    expect(html).toContain(`src="${CF_BASE}/width=1024"`)
    expect(html).not.toContain('/public')
  })

  // Vidstack needs browser media APIs, so its `poster` cannot be asserted
  // through SSR. Both branches call this one function instead.
  it('resolves one width for both branches, and passes other URLs through', () => {
    expect(posterURL(CF_PUBLIC_URL)).toBe(`${CF_BASE}/width=1024`)
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

describe('VideoPlayer poster srcset', () => {
  // The mounted player takes one URL from Vidstack, but the fallback is a
  // plain <img>, so it can offer the whole ladder and let the box and the
  // device pixel ratio pick.
  it('offers every video width in the SSR fallback', () => {
    const html = renderToStaticMarkup(
      <VideoPlayer hlsUrl="https://cdn.example.com/v.m3u8" poster={CF_PUBLIC_URL} />,
    )

    expect(html).toContain(
      `srcSet="${CF_BASE}/width=640 640w, ${CF_BASE}/width=800 800w, ` +
        `${CF_BASE}/width=1024 1024w, ${CF_BASE}/width=1536 1536w"`,
    )
  })

  it('declares the bounded box by default', () => {
    const html = renderToStaticMarkup(
      <VideoPlayer hlsUrl="https://cdn.example.com/v.m3u8" poster={CF_PUBLIC_URL} />,
    )

    expect(html).toContain(`sizes="${BOUNDED_POSTER_SIZES}"`)
  })

  // The case the default is wrong for: an iframe at 1280-1920px used to get
  // the 1024px poster, because nothing caps /lectures/:id/embed.
  it('lets an unbounded route declare its own box', () => {
    const html = renderToStaticMarkup(
      <VideoPlayer
        hlsUrl="https://cdn.example.com/v.m3u8"
        poster={CF_PUBLIC_URL}
        posterSizes="100vw"
      />,
    )

    expect(html).toContain('sizes="100vw"')
    expect(html).not.toContain(BOUNDED_POSTER_SIZES)
  })

  // A `sizes` with no srcset to govern is inert markup, so neither is emitted.
  it.each([
    ['a story placeholder', 'https://picsum.photos/seed/talk/1024/576'],
    ['the SahajCloud dev fallback', '/api/videos/file/talk.jpg'],
  ])('emits neither attribute for %s', (_label, poster) => {
    const html = renderToStaticMarkup(
      <VideoPlayer hlsUrl="https://cdn.example.com/v.m3u8" poster={poster} />,
    )

    expect(html).not.toContain('srcSet=')
    expect(html).not.toContain('sizes=')
    expect(posterSrcSet(poster)).toBeUndefined()
  })
})
