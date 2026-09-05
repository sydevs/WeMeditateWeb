import { useState, useEffect, useCallback, useEffectEvent, useRef } from 'react'
import { useAudioPlayer as useAudioPlayerLib } from 'react-use-audio-player'

export interface UseAudioPlayerOptions {
  /** Audio URL to load (optional - can load later via controls.load) */
  url?: string
  /** Callback when playback starts */
  onPlay?: () => void
  /** Callback when playback pauses */
  onPause?: () => void
  /** Callback when track ends */
  onEnd?: () => void
  /** Callback fired every 100ms during playback (also on play/pause/seek) */
  onPlaybackTimeUpdate?: (currentTime: number) => void
  /** Auto-play when track loads (only used with url option) */
  autoplay?: boolean
}

export interface AudioPlayerState {
  isPlaying: boolean
  isPaused: boolean
  isLoading: boolean
  isReady: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  /** Error message from audio loading/playback, if any */
  error: string | null
}

export interface AudioPlayerControls {
  play: () => void
  pause: () => void
  togglePlayPause: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  /** Unmute the audio (idempotent — a no-op when already unmuted). */
  unmute: () => void
  /**
   * Load a new audio URL with options.
   * Use this for dynamic loading (for example, playlists), instead of the url option.
   */
  load: (url: string, options?: { autoplay?: boolean; onEnd?: () => void }) => void
}

/**
 * Core audio player hook. Wraps react-use-audio-player.
 * Adds time polling, seek with callbacks, and track loading.
 *
 * This hook shadows the library's useAudioPlayer, and adds:
 * - Automatic time polling (100ms interval while playing)
 * - Callbacks for play, pause, end, and time updates
 * - A clean state/controls return tuple
 * - Flexible loading, with the url option or controls.load
 *
 * @example
 * // Basic usage with the url option (auto-loads)
 * const [state, controls] = useAudioPlayer({
 *   url: '/audio/track.mp3',
 *   onPlaybackTimeUpdate: (time) => console.log(`At ${time}s`)
 * })
 *
 * @example
 * // Dynamic loading, for playlists
 * const [state, controls] = useAudioPlayer({
 *   onPlaybackTimeUpdate: (time) => updateProgress(time)
 * })
 * // Then load when ready:
 * controls.load(trackUrl, { autoplay: true, onEnd: handleTrackEnd })
 */
export function useAudioPlayer({
  url,
  onPlay,
  onPause,
  onEnd,
  onPlaybackTimeUpdate,
  autoplay = false,
}: UseAudioPlayerOptions = {}): [AudioPlayerState, AudioPlayerControls] {
  // Library hook for audio control
  const player = useAudioPlayerLib()

  // Local state for current time (updated through polling)
  const [currentTime, setCurrentTime] = useState(0)
  const soundIdRef = useRef<number | null>(null)

  // Effect Events always read the latest props and state, not dependencies
  const updateTime = useEffectEvent(() => {
    const howl = player.player
    const time =
      howl && soundIdRef.current !== null
        ? (howl.seek(soundIdRef.current) as number)
        : player.getPosition()

    setCurrentTime(time)
    onPlaybackTimeUpdate?.(time)
  })

  // Effect Events for callbacks: always read the latest props and avoid stale closures
  const handleOnPlay = useEffectEvent((soundId?: number) => {
    if (typeof soundId === 'number') {
      soundIdRef.current = soundId
    }
    onPlay?.()
  })

  const handleOnPause = useEffectEvent(() => {
    onPause?.()
  })

  const handleOnEnd = useEffectEvent(() => {
    soundIdRef.current = null
    onEnd?.()
  })

  // Seek handler, simplified because html5 mode is disabled
  const seekTo = useEffectEvent((time: number) => {
    const howl = player.player

    if (howl && soundIdRef.current !== null) {
      howl.seek(time, soundIdRef.current)
    } else {
      player.seek(time)
    }
    setCurrentTime(time)
    onPlaybackTimeUpdate?.(time)
  })

  // Load track with the url option, when provided
  // Note: This only reloads when url changes. Callbacks use useEffectEvent, so they always read the latest values.
  useEffect(() => {
    if (url) {
      soundIdRef.current = null
      player.load(url, {
        autoplay,
        html5: true,
        onplay: ((soundId?: number) => handleOnPlay(soundId)) as () => void,
        onpause: () => handleOnPause(),
        onend: () => handleOnEnd(),
      })
    }
  }, [url, autoplay])

  // Poll for current time (100ms interval when playing)
  useEffect(() => {
    if (player.isPlaying) {
      updateTime()
      const interval = setInterval(updateTime, 100)

      return () => clearInterval(interval)
    }
  }, [player.isPlaying])

  // Update time when paused (fire callback on pause)
  useEffect(() => {
    if (player.isPaused) {
      updateTime()
    }
  }, [player.isPaused])

  // Seek handler with callback
  const seek = useCallback((time: number) => {
    seekTo(time)
  }, [])

  // Play/pause handlers that track a single sound id to avoid overlapping audio instances
  const play = useEffectEvent(() => {
    const howl = player.player

    if (!howl) {
      player.play()

      return
    }

    if (soundIdRef.current !== null) {
      if (!howl.playing(soundIdRef.current)) {
        howl.play(soundIdRef.current)
      }

      return
    }

    soundIdRef.current = howl.play()
  })

  const pause = useEffectEvent(() => {
    const howl = player.player

    if (howl) {
      howl.pause()

      return
    }

    player.pause()
  })

  const togglePlayPause = useEffectEvent(() => {
    if (player.isPlaying) {
      pause()

      return
    }

    play()
  })

  // Dynamic load function for playlists and manual loading
  // Note: Uses useEffectEvent handlers for consistent callback behavior
  const load = useCallback(
    (loadUrl: string, options?: { autoplay?: boolean; onEnd?: () => void }) => {
      soundIdRef.current = null
      player.load(loadUrl, {
        autoplay: options?.autoplay ?? false,
        html5: true,
        onplay: ((soundId?: number) => handleOnPlay(soundId)) as () => void,
        onpause: () => handleOnPause(),
        onend: () => {
          soundIdRef.current = null
          options?.onEnd?.() // Caller-provided onEnd for playlist track-end handling
        },
      })
    },
    [],
  )

  // Compose state
  const state: AudioPlayerState = {
    isPlaying: player.isPlaying,
    isPaused: player.isPaused,
    isLoading: player.isLoading,
    isReady: player.isReady,
    currentTime,
    duration: player.duration,
    volume: player.volume,
    isMuted: player.isMuted,
    error: player.error ?? null,
  }

  // Compose controls
  const controls: AudioPlayerControls = {
    play,
    pause,
    togglePlayPause,
    seek,
    setVolume: player.setVolume,
    toggleMute: player.toggleMute,
    unmute: player.unmute,
    load,
  }

  return [state, controls]
}
