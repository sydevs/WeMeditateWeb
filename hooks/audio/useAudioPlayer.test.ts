// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioPlayer } from './useAudioPlayer'

// Howler never plays under jsdom, so the library hook is replaced by a recorder.
// `howl` is the Howl the library exposes as `player`, null until a load.
const lib = vi.hoisted(() => ({
  isPlaying: false,
  howl: null as null | {
    play: ReturnType<typeof vi.fn>
    playing: ReturnType<typeof vi.fn>
    pause: ReturnType<typeof vi.fn>
    seek: ReturnType<typeof vi.fn>
  },
  load: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  seek: vi.fn(),
  getPosition: vi.fn(() => 0),
  unmute: vi.fn(),
}))

vi.mock('react-use-audio-player', () => ({
  useAudioPlayer: () => ({
    isPlaying: lib.isPlaying,
    isPaused: !lib.isPlaying,
    isLoading: false,
    isReady: true,
    duration: 600,
    volume: 1,
    isMuted: false,
    error: undefined,
    player: lib.howl,
    load: lib.load,
    play: lib.play,
    pause: lib.pause,
    seek: lib.seek,
    getPosition: lib.getPosition,
    setVolume: vi.fn(),
    toggleMute: vi.fn(),
    unmute: lib.unmute,
  }),
}))

/** A loaded Howl whose first `play()` starts sound 7. */
function loadedHowl(playing = false) {
  lib.howl = {
    play: vi.fn(() => 7),
    playing: vi.fn(() => playing),
    pause: vi.fn(),
    seek: vi.fn(() => 0),
  }

  return lib.howl
}

const lastLoadOptions = () => lib.load.mock.calls.at(-1)?.[1]

beforeEach(() => {
  vi.clearAllMocks()
  lib.isPlaying = false
  lib.howl = null
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useAudioPlayer — loading', () => {
  it('loads the url option as html5, and again only when the url changes', () => {
    const { rerender } = renderHook(({ url }) => useAudioPlayer({ url }), {
      initialProps: { url: 'https://example.com/a.mp3' },
    })

    expect(lib.load).toHaveBeenCalledOnce()
    expect(lib.load.mock.calls[0][0]).toBe('https://example.com/a.mp3')
    expect(lastLoadOptions()).toMatchObject({ autoplay: false, html5: true })

    rerender({ url: 'https://example.com/a.mp3' })
    expect(lib.load).toHaveBeenCalledOnce()

    rerender({ url: 'https://example.com/b.mp3' })
    expect(lib.load).toHaveBeenCalledTimes(2)
    expect(lib.load.mock.calls[1][0]).toBe('https://example.com/b.mp3')
  })

  it("hands the end of a track it loads to the caller's onEnd alone", () => {
    const hookOnEnd = vi.fn()
    const callerOnEnd = vi.fn()
    const { result } = renderHook(() => useAudioPlayer({ onEnd: hookOnEnd }))

    act(() =>
      result.current[1].load('https://example.com/a.mp3', { autoplay: true, onEnd: callerOnEnd }),
    )
    expect(lastLoadOptions()).toMatchObject({ autoplay: true, html5: true })

    act(() => lastLoadOptions().onend())

    expect(callerOnEnd).toHaveBeenCalledOnce()
    expect(hookOnEnd).not.toHaveBeenCalled()
  })
})

describe('useAudioPlayer — one sound per track', () => {
  it('starts one sound, then resumes that same sound rather than a second', () => {
    const howl = loadedHowl()
    const { result } = renderHook(() => useAudioPlayer())

    act(() => result.current[1].play())
    act(() => result.current[1].play())

    expect(howl.play.mock.calls).toEqual([[], [7]])
  })

  it('leaves a sound that is already playing alone', () => {
    const howl = loadedHowl(true)
    const { result } = renderHook(() => useAudioPlayer())

    act(() => result.current[1].play())
    act(() => result.current[1].play())

    expect(howl.play).toHaveBeenCalledOnce()
  })

  it('asks the library to play before any Howl exists', () => {
    const { result } = renderHook(() => useAudioPlayer())

    act(() => result.current[1].play())

    expect(lib.play).toHaveBeenCalledOnce()
  })
})

describe('useAudioPlayer — seek', () => {
  it('seeks the sound it started, and reports the new time at once', () => {
    const howl = loadedHowl()
    const onPlaybackTimeUpdate = vi.fn()
    const { result } = renderHook(() => useAudioPlayer({ onPlaybackTimeUpdate }))

    act(() => result.current[1].play())
    act(() => result.current[1].seek(42))

    expect(howl.seek).toHaveBeenCalledExactlyOnceWith(42, 7)
    expect(lib.seek).not.toHaveBeenCalled()
    expect(result.current[0].currentTime).toBe(42)
    expect(onPlaybackTimeUpdate).toHaveBeenLastCalledWith(42)
  })

  it('seeks through the library before a sound has started', () => {
    const { result } = renderHook(() => useAudioPlayer())

    act(() => result.current[1].seek(42))

    expect(lib.seek).toHaveBeenCalledExactlyOnceWith(42)
  })
})

describe('useAudioPlayer — time polling', () => {
  it('reads the position every 100ms while playing, and stops when paused', () => {
    vi.useFakeTimers()
    lib.isPlaying = true
    lib.getPosition.mockReturnValue(12)

    const onPlaybackTimeUpdate = vi.fn()
    const { result, rerender } = renderHook(() => useAudioPlayer({ onPlaybackTimeUpdate }))

    expect(result.current[0].currentTime).toBe(12)

    lib.getPosition.mockReturnValue(12.1)
    act(() => vi.advanceTimersByTime(100))
    expect(result.current[0].currentTime).toBe(12.1)
    expect(onPlaybackTimeUpdate).toHaveBeenLastCalledWith(12.1)

    lib.isPlaying = false
    rerender()
    const reads = lib.getPosition.mock.calls.length

    act(() => vi.advanceTimersByTime(500))
    expect(lib.getPosition.mock.calls.length).toBe(reads)
  })
})

describe('useAudioPlayer — unmute', () => {
  it("passes through to the library's own", () => {
    const { result } = renderHook(() => useAudioPlayer())

    act(() => result.current[1].unmute())

    expect(lib.unmute).toHaveBeenCalledOnce()
  })
})
