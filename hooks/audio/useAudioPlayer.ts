import { useState, useEffect, useCallback, useEffectEvent } from 'react'
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
}

export interface AudioPlayerControls {
  play: () => void
  pause: () => void
  togglePlayPause: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  /**
   * Load a new audio URL with options.
   * Use this for dynamic loading (e.g., playlists) instead of the url option.
   */
  load: (url: string, options?: { autoplay?: boolean; onEnd?: () => void }) => void
}

/**
 * Core audio player hook that wraps react-use-audio-player.
 * Provides time polling, seek with callbacks, and track loading.
 *
 * This hook shadows the library's useAudioPlayer with additional features:
 * - Automatic time polling (100ms interval when playing)
 * - Callbacks for play/pause/end/time updates
 * - Clean state/controls return tuple
 * - Flexible loading (via url option or controls.load)
 *
 * @example
 * // Basic usage with URL option (auto-loads)
 * const [state, controls] = useAudioPlayer({
 *   url: '/audio/track.mp3',
 *   onPlaybackTimeUpdate: (time) => console.log(`At ${time}s`)
 * })
 *
 * @example
 * // Dynamic loading (for playlists)
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

  // Local state for current time (updated via polling)
  const [currentTime, setCurrentTime] = useState(0)

  // Effect Events - always access latest props/state, not dependencies
  const updateTime = useEffectEvent(() => {
    const time = player.getPosition()
    setCurrentTime(time)
    onPlaybackTimeUpdate?.(time)
  })

  // Handler for onplay callback
  const handleOnPlay = useEffectEvent(() => {
    onPlay?.()
  })

  // Seek handler - simplified since html5 mode is disabled
  const seekTo = useEffectEvent((time: number) => {
    player.seek(time)
    setCurrentTime(time)
    onPlaybackTimeUpdate?.(time)
  })

  // Load track via URL option (when provided)
  useEffect(() => {
    if (url) {
      player.load(url, {
        autoplay,
        html5: true, // Better for streaming large files
        onplay: () => onPlay?.(),
        onpause: () => onPause?.(),
        onend: () => onEnd?.(),
      })
    }
  }, [url])

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

  // Dynamic load function for playlists and manual loading
  const load = useCallback((loadUrl: string, options?: { autoplay?: boolean; onEnd?: () => void }) => {
    player.load(loadUrl, {
      autoplay: options?.autoplay ?? false,
      html5: true,
      onplay: () => handleOnPlay(),
      onpause: () => onPause?.(),
      onend: () => options?.onEnd?.(),
    })
  }, [onPause])

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
  }

  // Compose controls
  const controls: AudioPlayerControls = {
    play: player.play,
    pause: player.pause,
    togglePlayPause: player.togglePlayPause,
    seek,
    setVolume: player.setVolume,
    toggleMute: player.toggleMute,
    load,
  }

  return [state, controls]
}
