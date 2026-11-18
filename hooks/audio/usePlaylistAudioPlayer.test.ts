// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePlaylistAudioPlayer } from './usePlaylistAudioPlayer'
import type { AudioPlayerControls, AudioPlayerState } from './useAudioPlayer'
import type { Track } from '../../components/molecules/AudioPlayer/types'

// Howler never plays under jsdom, so the core hook is replaced by a recorder.
const player = vi.hoisted(() => ({ load: vi.fn(), play: vi.fn(), isPlaying: false }))

vi.mock('./useAudioPlayer', () => ({
  useAudioPlayer: () => [
    {
      isPlaying: player.isPlaying,
      isPaused: !player.isPlaying,
      isLoading: false,
      isReady: true,
      currentTime: 0,
      duration: 0,
      volume: 1,
      isMuted: false,
      error: null,
    } satisfies AudioPlayerState,
    { load: player.load, play: player.play } satisfies Partial<AudioPlayerControls>,
  ],
}))

const tracks: Track[] = ['one', 'two', 'three'].map((name) => ({
  url: `https://cdn.example.com/${name}.mp3`,
  title: name,
  credit: '',
  creditURL: '',
  thumbnailURL: '',
  duration: 0,
}))

const lastLoad = () => {
  const [url, options] = player.load.mock.calls.at(-1) ?? []

  return { url, autoplay: options?.autoplay }
}

beforeEach(() => {
  player.load.mockClear()
  player.play.mockClear()
  player.isPlaying = false
})

describe('usePlaylistAudioPlayer — next and previous', () => {
  it('steps through the play order and wraps at both ends', () => {
    const { result } = renderHook(() => usePlaylistAudioPlayer({ tracks }))
    const step = (move: 'next' | 'previous') => act(() => result.current[1][move]())

    step('previous')
    expect(lastLoad().url).toBe(tracks[2].url)

    step('next')
    expect(lastLoad().url).toBe(tracks[0].url)

    step('next')
    expect(result.current[0].currentTrackIndex).toBe(1)
    expect(lastLoad().url).toBe(tracks[1].url)
  })

  it.each([true, false])('carries playback across a skip when playing is %s', (isPlaying) => {
    player.isPlaying = isPlaying
    const { result } = renderHook(() => usePlaylistAudioPlayer({ tracks }))

    act(() => result.current[1].next())

    expect(lastLoad().autoplay).toBe(isPlaying)
  })
})

describe('usePlaylistAudioPlayer — selectTrack', () => {
  it('loads another track and plays it, from a paused player', () => {
    const { result } = renderHook(() => usePlaylistAudioPlayer({ tracks }))

    act(() => result.current[1].selectTrack(2))

    expect(lastLoad()).toEqual({ url: tracks[2].url, autoplay: true })
  })

  it('plays the loaded track in place when its own row is picked', () => {
    const { result } = renderHook(() => usePlaylistAudioPlayer({ tracks }))
    const loads = player.load.mock.calls.length

    act(() => result.current[1].selectTrack(0))

    expect(player.play).toHaveBeenCalledOnce()
    expect(player.load.mock.calls.length).toBe(loads)
  })
})
