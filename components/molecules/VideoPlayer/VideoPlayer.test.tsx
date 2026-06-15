import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { VideoPlayer } from './VideoPlayer'

// Note: HLS attachment and the subtitle <track> are wired up in effects, which
// do not run under renderToStaticMarkup — those are verified in the browser.
// Here we assert the server-rendered shell (poster, controls, a11y label).

describe('<VideoPlayer>', () => {
  it('renders an accessible <video> shell with poster and controls', () => {
    const html = renderToStaticMarkup(
      <VideoPlayer
        hlsUrl="https://cdn.example.com/v.m3u8"
        poster="https://img.example.com/p.jpg"
        title="A talk"
      />,
    )

    expect(html).toContain('<video')
    expect(html).toContain('controls')
    expect(html).toContain('playsInline')
    expect(html).toContain('poster="https://img.example.com/p.jpg"')
    expect(html).toContain('aria-label="A talk"')
    expect(html).toContain('preload="metadata"')
  })

  it('does not emit the HLS source or subtitle track during SSR (client-only effects)', () => {
    const html = renderToStaticMarkup(
      <VideoPlayer
        hlsUrl="https://cdn.example.com/v.m3u8"
        subtitles={[{ content: 'Hi', startTimeMs: 0, endTimeMs: 1000 }]}
      />,
    )

    expect(html).not.toContain('<track')
    expect(html).not.toContain('src="https://cdn.example.com/v.m3u8"')
  })

  it('renders nothing when hlsUrl is empty', () => {
    expect(renderToStaticMarkup(<VideoPlayer hlsUrl="" />)).toBe('')
  })

  // External per-locale .vtt tracks (Lecture shape) render directly from their
  // URLs (no Blob), so — unlike inline cues — they ARE present in SSR markup.
  it('renders per-locale subtitle tracks, defaulting to the current locale', () => {
    const html = renderToStaticMarkup(
      <VideoPlayer
        defaultSubtitleLang="fr"
        hlsUrl="https://cdn.example.com/v.m3u8"
        subtitleTracks={[
          { locale: 'en', url: 'https://cdn.example.com/en.vtt' },
          { locale: 'fr', url: 'https://cdn.example.com/fr.vtt' },
        ]}
      />,
    )

    expect(html).toContain('src="https://cdn.example.com/en.vtt"')
    expect(html).toContain('src="https://cdn.example.com/fr.vtt"')
    // React 19 SSR preserves srcLang casing (but lowercases crossOrigin below).
    expect(html).toContain('srcLang="fr"')
    // The cross-origin tracks require the video to opt into CORS.
    expect(html).toContain('crossorigin="anonymous"')
    // Exactly one track is the default (the current-locale one).
    expect(html.match(/<track[^>]*\bdefault\b/g)).toHaveLength(1)
  })

  it('omits crossorigin when there are no external subtitle tracks', () => {
    const html = renderToStaticMarkup(<VideoPlayer hlsUrl="https://cdn.example.com/v.m3u8" />)

    expect(html).not.toContain('crossorigin')
  })
})
