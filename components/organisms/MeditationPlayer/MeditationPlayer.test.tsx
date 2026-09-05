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
