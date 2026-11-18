// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePlaylistAudioPlayer } from './usePlaylistAudioPlayer'
import type { Track } from '../../components/molecules/AudioPlayer/types'

// Howler never plays under jsdom, so the core hook is replaced by a recorder.
const player = vi.hoisted(() => ({ load: vi.fn(), isPlaying: false }))

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
    },
    { load: player.load },
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

const lastLoad = () => player.load.mock.calls.at(-1)

beforeEach(() => {
  player.load.mockClear()
  player.isPlaying = false
})

describe('usePlaylistAudioPlayer — next and previous', () => {
  it('steps through the play order and wraps at both ends', () => {
    const { result } = renderHook(() => usePlaylistAudioPlayer({ tracks }))

    act(() => result.current[1].next())
    expect(result.current[0].currentTrackIndex).toBe(1)
    expect(lastLoad()?.[0]).toBe(tracks[1].url)

    act(() => result.current[1].previous())
    act(() => result.current[1].previous())
    expect(result.current[0].currentTrackIndex).toBe(2)
    expect(result.current[0].currentTrack).toBe(tracks[2])
    expect(lastLoad()?.[0]).toBe(tracks[2].url)
  })

  it('keeps playing across a skip, and stays paused across one', () => {
    const { result, rerender } = renderHook(() => usePlaylistAudioPlayer({ tracks }))

    act(() => result.current[1].next())
    expect(lastLoad()?.[1]).toMatchObject({ autoplay: false })

    player.isPlaying = true
    rerender()
    act(() => result.current[1].next())
    expect(lastLoad()?.[1]).toMatchObject({ autoplay: true })
  })
})
