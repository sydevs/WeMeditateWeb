// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { render, screen, fireEvent } from '@testing-library/react'
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
  unmute: noop,
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

describe('<AudioPlayer> volume slider', () => {
  // Howler's `volume()` leaves its mute in place, and the slider reads 0 while
  // muted, so a slider that only set the volume snapped back to 0 on every drag.
  it('unmutes when it moves while muted', () => {
    const setVolume = vi.fn()
    const unmute = vi.fn()

    render(
      <AudioPlayer
        controls={{ ...controls, setVolume, unmute }}
        state={{ ...state, isMuted: true, volume: 0.6 }}
      />,
    )

    fireEvent.change(screen.getByRole('slider', { name: 'Volume' }), { target: { value: '0.3' } })

    expect(setVolume).toHaveBeenCalledExactlyOnceWith(0.3)
    expect(unmute).toHaveBeenCalledOnce()
  })
})
