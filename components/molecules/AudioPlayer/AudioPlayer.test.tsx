import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { AudioPlayer } from './AudioPlayer'
import type { Track, PlaylistAudioPlayerControls, PlaylistAudioPlayerState } from './types'
import { CF_PUBLIC_URL } from '../../../tests/_helpers/cloudflare-images'

const track: Track = {
  url: 'https://example.com/song.mp3',
  title: 'Raag Durga',
  credit: 'Anon',
  creditURL: 'https://example.com',
  thumbnailURL: CF_PUBLIC_URL,
  duration: 300,
}

const state: PlaylistAudioPlayerState = {
  currentTrackIndex: 0,
  trackCount: 1,
  isPlaying: false,
  currentTime: 0,
  duration: track.duration,
  volume: 1,
  isMuted: false,
  isShuffleOn: false,
  currentTrack: track,
  isLoading: false,
}

const noop = () => {}

const controls: PlaylistAudioPlayerControls = {
  play: noop,
  pause: noop,
  togglePlayPause: noop,
  previous: noop,
  next: noop,
  seek: noop,
  setVolume: noop,
  toggleMute: noop,
  toggleShuffle: noop,
  selectTrack: noop,
}

describe('<AudioPlayer> now-playing thumbnail sizes', () => {
  it('advertises the 48px box it draws', () => {
    const html = renderToStaticMarkup(<AudioPlayer controls={controls} state={state} />)

    // Asserted together, so the pixel number cannot outlive the box.
    expect(html).toContain('w-12 h-12')
    expect(html).toContain('sizes="48px"')
    expect(html).not.toContain('/public')
  })
})
