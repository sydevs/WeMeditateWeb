// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePlaylistAudioPlayer } from './usePlaylistAudioPlayer'
import type { AudioPlayerControls, AudioPlayerState } from './useAudioPlayer'
import type { Track } from '@/lib/media/audio'

// Howler never plays under jsdom, so the core hook is replaced by a recorder.
const player = vi.hoisted(() => ({
  load: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  unmute: vi.fn(),
  isPlaying: false,
}))

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
    {
      load: player.load,
      play: player.play,
      pause: player.pause,
      unmute: player.unmute,
    } satisfies Partial<AudioPlayerControls>,
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

// Howler calls this from the load that registered it, when the track ends.
const endCurrentTrack = () => player.load.mock.calls.at(-1)?.[1]?.onEnd?.()

beforeEach(() => {
  player.load.mockClear()
  player.play.mockClear()
  player.pause.mockClear()
  player.unmute.mockClear()
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

  it.each([
    ['play', true],
    ['pause', false],
  ] as const)('carries what the listener last asked for, after %s', (ask, autoplay) => {
    const { result } = renderHook(() => usePlaylistAudioPlayer({ tracks }))

    act(() => result.current[1].play())
    act(() => result.current[1][ask]())
    act(() => result.current[1].next())

    expect(lastLoad().autoplay).toBe(autoplay)
  })

  // The defect (#256). Reading the flag back off `playerState.isPlaying` made
  // the second skip load silent, because a load reports no playback.
  it('keeps playing when the next skip lands inside the load the last one started', () => {
    const { result } = renderHook(() => usePlaylistAudioPlayer({ tracks }))

    act(() => result.current[1].play())
    player.isPlaying = true

    act(() => result.current[1].next())
    player.isPlaying = false

    act(() => result.current[1].next())

    expect(lastLoad()).toEqual({ url: tracks[2].url, autoplay: true })
  })
})

describe('usePlaylistAudioPlayer — the end of a track', () => {
  it('advances in play order and keeps playing', () => {
    const { result } = renderHook(() => usePlaylistAudioPlayer({ tracks }))

    act(() => result.current[1].play())
    player.isPlaying = true

    act(() => endCurrentTrack())

    expect(result.current[0].currentTrackIndex).toBe(1)
    expect(lastLoad()).toEqual({ url: tracks[1].url, autoplay: true })
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

  it('states the intent a later skip reads, when its own row is picked', () => {
    const { result } = renderHook(() => usePlaylistAudioPlayer({ tracks }))

    act(() => result.current[1].selectTrack(0))
    act(() => result.current[1].next())

    expect(lastLoad().autoplay).toBe(true)
  })
})

describe('usePlaylistAudioPlayer — unmute', () => {
  // AudioPlayer's volume slider calls it on every move, so a muted playlist
  // becomes audible again by moving the slider.
  it('unmutes the core player', () => {
    const { result } = renderHook(() => usePlaylistAudioPlayer({ tracks }))

    act(() => result.current[1].unmute())

    expect(player.unmute).toHaveBeenCalledOnce()
  })
})
