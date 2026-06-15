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
})
