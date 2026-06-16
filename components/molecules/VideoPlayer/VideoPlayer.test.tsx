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

  it('uses native controls when there is no clip window', () => {
    const html = renderToStaticMarkup(<VideoPlayer hlsUrl="https://cdn.example.com/v.m3u8" />)

    expect(html).toMatch(/<video[^>]*\bcontrols\b/)
    expect(html).not.toContain('aria-label="Seek"')
  })

  // A clip presents its window as an isolated 0:00 clip: native controls are
  // replaced by a custom bar whose timeline runs 0:00 → the window length
  // (40s here), not the underlying media position (19:51 → 20:31).
  it('presents a clip window with relinearized custom controls', () => {
    const html = renderToStaticMarkup(
      <VideoPlayer hlsUrl="https://cdn.example.com/v.m3u8" startTime={1191} stopTime={1231} />,
    )

    expect(html).not.toMatch(/<video[^>]*\bcontrols\b/) // native controls off
    expect(html).toContain('aria-label="Seek"')
    expect(html).toContain('max="40"') // window length, not full duration
    expect(html).toContain('0:00') // elapsed starts at the clip start
    expect(html).toContain('0:40') // total = window length
    expect(html).not.toContain('20:31') // never the absolute media position
  })

  // Per-locale .vtt tracks (Lecture shape) are fetched and re-served as
  // same-origin blobs in an effect (to fix text/plain content-types and avoid
  // forcing crossOrigin), so — like inline cues — they are NOT in SSR markup,
  // and the video never opts into CORS (which would break Safari native HLS).
  it('does not emit external subtitle tracks or crossorigin during SSR', () => {
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

    expect(html).not.toContain('<track')
    expect(html).not.toContain('crossorigin')
    expect(html).not.toContain('en.vtt')
  })
})
