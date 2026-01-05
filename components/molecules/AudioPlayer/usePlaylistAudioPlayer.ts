import { useState, useEffect, useCallback, useEffectEvent, useRef } from 'react'
import { useAudioPlayer } from 'react-use-audio-player'
import type { Track, PlaylistAudioPlayerState, PlaylistAudioPlayerControls } from './types'

export interface UsePlaylistAudioPlayerOptions {
  /** Array of tracks to manage */
  tracks: Track[]
  /** Enable shuffle mode on initialization */
  shuffle?: boolean
  /** Initial track index to start with */
  initialTrackIndex?: number
  /** Callback when track changes */
  onTrackChange?: (trackIndex: number) => void
  /** Callback fired every 100ms during playback (also on play/pause/seek) */
  onPlaybackTimeUpdate?: (currentTime: number) => void
}

/**
 * Playlist wrapper hook for react-use-audio-player.
 * Adds playlist management (tracks, shuffle, next/prev) on top of the library.
 *
 * @example
 * // Basic usage
 * const [state, controls] = usePlaylistAudioPlayer({
 *   tracks: [{ url: '/audio.mp3', title: 'Track 1', ... }],
 *   shuffle: false
 * })
 *
 * @example
 * // With callbacks
 * const [state, controls] = usePlaylistAudioPlayer({
 *   tracks: myTracks,
 *   onTrackChange: (index) => console.log(`Now playing track ${index}`),
 *   onPlaybackTimeUpdate: (time) => console.log(`At ${time}s`)
 * })
 */
export function usePlaylistAudioPlayer({
  tracks,
  shuffle = false,
  initialTrackIndex = 0,
  onTrackChange,
  onPlaybackTimeUpdate,
}: UsePlaylistAudioPlayerOptions): [PlaylistAudioPlayerState, PlaylistAudioPlayerControls] {
  // Library hook for audio control
  const player = useAudioPlayer()

  // Playlist state
  const [currentTrackIndex, setCurrentTrackIndex] = useState(initialTrackIndex)
  const [isShuffleOn, setIsShuffleOn] = useState(shuffle)
  const [playOrder, setPlayOrder] = useState<number[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [hasEnded, setHasEnded] = useState(false)

  // Ref for tracking if audio was playing before track change (for auto-resume)
  const wasPlayingRef = useRef(false)

  const currentTrack = tracks[currentTrackIndex]

  // Initialize/update play order when shuffle changes or tracks change
  useEffect(() => {
    if (isShuffleOn) {
      // Fisher-Yates shuffle algorithm
      const shuffled = [...Array(tracks.length).keys()]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      setPlayOrder(shuffled)
    } else {
      setPlayOrder([...Array(tracks.length).keys()])
    }
  }, [isShuffleOn, tracks.length])

  // Effect Events - always access latest props/state, not dependencies
  const handleTrackEnd = useEffectEvent(() => {
    setHasEnded(true)
    const currentOrderIndex = playOrder.indexOf(currentTrackIndex)
    const nextOrderIndex = currentOrderIndex < playOrder.length - 1 ? currentOrderIndex + 1 : 0
    setCurrentTrackIndex(playOrder[nextOrderIndex])
  })

  const loadCurrentTrack = useEffectEvent(() => {
    if (currentTrack) {
      player.load(currentTrack.url, {
        autoplay: wasPlayingRef.current,
        html5: true, // Better for streaming large files
        onend: handleTrackEnd,
      })
      onTrackChange?.(currentTrackIndex)
    }
  })

  const updateTime = useEffectEvent(() => {
    const time = player.getPosition()
    setCurrentTime(time)
    onPlaybackTimeUpdate?.(time)
  })

  const seekTo = useEffectEvent((time: number) => {
    player.seek(time)
    setCurrentTime(time)
    onPlaybackTimeUpdate?.(time)
  })

  // Load track when currentTrackIndex changes
  useEffect(() => {
    loadCurrentTrack()
  }, [currentTrackIndex, currentTrack?.url])

  // Poll for current time (100ms interval when playing)
  useEffect(() => {
    if (player.isPlaying) {
      wasPlayingRef.current = true
      setHasEnded(false)
      updateTime()
      const interval = setInterval(updateTime, 100)
      return () => clearInterval(interval)
    } else if (!player.isLoading && !player.isReady) {
      // Reset when stopped/unloaded
      wasPlayingRef.current = false
    }
  }, [player.isPlaying, player.isLoading, player.isReady])

  // Update time when paused (fire callback on pause)
  useEffect(() => {
    if (player.isPaused) {
      updateTime()
    }
  }, [player.isPaused])

  // Navigation controls
  const previous = useCallback(() => {
    const currentOrderIndex = playOrder.indexOf(currentTrackIndex)
    const prevIndex = currentOrderIndex > 0 ? currentOrderIndex - 1 : playOrder.length - 1
    wasPlayingRef.current = player.isPlaying
    setCurrentTrackIndex(playOrder[prevIndex])
  }, [playOrder, currentTrackIndex, player.isPlaying])

  const next = useCallback(() => {
    const currentOrderIndex = playOrder.indexOf(currentTrackIndex)
    const nextIndex = currentOrderIndex < playOrder.length - 1 ? currentOrderIndex + 1 : 0
    wasPlayingRef.current = player.isPlaying
    setCurrentTrackIndex(playOrder[nextIndex])
  }, [playOrder, currentTrackIndex, player.isPlaying])

  // Seek with callback
  const seek = useCallback((time: number) => {
    seekTo(time)
  }, [])

  const toggleShuffle = useCallback(() => {
    setIsShuffleOn((prev) => !prev)
  }, [])

  const selectTrack = useCallback(
    (index: number) => {
      wasPlayingRef.current = player.isPlaying
      setCurrentTrackIndex(index)
    },
    [player.isPlaying]
  )

  // Compose state
  const state: PlaylistAudioPlayerState = {
    currentTrackIndex,
    isPlaying: player.isPlaying,
    currentTime,
    duration: player.duration,
    volume: player.volume,
    isMuted: player.isMuted,
    isShuffleOn,
    currentTrack,
    isLoading: player.isLoading,
    hasEnded,
  }

  // Compose controls
  const controls: PlaylistAudioPlayerControls = {
    play: player.play,
    pause: player.pause,
    togglePlayPause: player.togglePlayPause,
    previous,
    next,
    seek,
    setVolume: player.setVolume,
    toggleMute: player.toggleMute,
    toggleShuffle,
    selectTrack,
  }

  return [state, controls]
}
