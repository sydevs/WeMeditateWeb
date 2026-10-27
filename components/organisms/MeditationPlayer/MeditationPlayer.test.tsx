import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MeditationPlayer } from './MeditationPlayer'
import type { Track } from '../../molecules/AudioPlayer/types'

const track: Track = {
  url: 'https://example.com/voice.mp3',
  title: 'Test Meditation',
  credit: '',
  creditURL: '',
  thumbnailURL: '',
  duration: 600,
}

const musicTrack = { id: 1, title: 'Raag Durga', url: 'https://example.com/music.mp3' }

// The shape a SahajCloud read sends: `…/<image_id>/public`
// (sydevs/SahajCloud `src/plugins/storage/cloudflareImagesAdapter.ts:203`).
const CF_PUBLIC_URL = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123/public'
const BASE = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123'

/**
 * SSR markup assertions only. The audio-settings popover is closed on first
 * render, and useEffect does not run under SSR, so these tests do not
 * assert the Voice and Music sliders or the shuffle button. Ladle verifies
 * those interactive parts visually instead. SSR can prove the voice-only
 * versus with-music contract: the speaker trigger, and the
 * background-music <audio>.
 */
describe('MeditationPlayer audio controls', () => {
  it('renders the audio-settings speaker button (replacing the inline volume slider)', () => {
    const html = renderToStaticMarkup(<MeditationPlayer frames={[]} track={track} />)

    expect(html).toContain('aria-label="Audio settings"')
    // The old single control was labeled "Volume". It should be gone.
    expect(html).not.toContain('aria-label="Volume"')
  })

  it('renders a looping background-music <audio> with the track URL when songs exist', () => {
    const html = renderToStaticMarkup(
      <MeditationPlayer frames={[]} musicTracks={[musicTrack]} track={track} />,
    )

    expect(html).toContain('<audio')
    expect(html).toContain('https://example.com/music.mp3')
    expect(html).toContain('loop')
  })

  it('omits the background-music <audio> when there are no songs (voice-only)', () => {
    const html = renderToStaticMarkup(<MeditationPlayer frames={[]} track={track} />)

    expect(html).not.toContain('<audio')
  })
})

describe('MeditationPlayer frame variant', () => {
  // The frame <img> is hand-rolled, so it never reached the variant pipeline
  // and the circular player served the original (#146).
  it('requests the 800px square width for a SahajCloud frame', () => {
    const html = renderToStaticMarkup(
      <MeditationPlayer
        frames={[{ timestamp: 0, media: { type: 'image', src: CF_PUBLIC_URL } }]}
        track={track}
      />,
    )

    expect(html).toContain(`src="${BASE}/width=800"`)
    expect(html).not.toContain('/public')
  })

  // The video branch is an HLS or MP4 source, not an image.
  it('leaves a video frame and its MP4 fallback untouched', () => {
    const html = renderToStaticMarkup(
      <MeditationPlayer
        frames={[
          {
            timestamp: 0,
            media: {
              type: 'video',
              src: 'https://cdn.example.com/f.m3u8',
              fallbackSrc: 'https://cdn.example.com/f.mp4',
            },
          },
        ]}
        track={track}
      />,
    )

    expect(html).toContain('src="https://cdn.example.com/f.m3u8"')
    expect(html).toContain('src="https://cdn.example.com/f.mp4"')
  })

  it.each([
    ['a story placeholder', 'https://picsum.photos/seed/frame/800/800'],
    ['the SahajCloud dev fallback', '/api/meditations/file/frame.jpg'],
  ])('leaves %s unchanged', (_label, src) => {
    const html = renderToStaticMarkup(
      <MeditationPlayer frames={[{ timestamp: 0, media: { type: 'image', src } }]} track={track} />,
    )

    expect(html).toContain(`src="${src}"`)
  })
})
