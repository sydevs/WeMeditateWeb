import { useState, useEffect, useCallback, useRef } from 'react'
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

  // Refs to avoid stale closures and track state across renders
  const wasPlayingRef = useRef(false)
  const onTrackChangeRef = useRef(onTrackChange)
  const onPlaybackTimeUpdateRef = useRef(onPlaybackTimeUpdate)
  const playOrderRef = useRef(playOrder)
  const currentTrackIndexRef = useRef(currentTrackIndex)

  // Keep refs in sync
  useEffect(() => {
    onTrackChangeRef.current = onTrackChange
  }, [onTrackChange])

  useEffect(() => {
    onPlaybackTimeUpdateRef.current = onPlaybackTimeUpdate
  }, [onPlaybackTimeUpdate])

  useEffect(() => {
    playOrderRef.current = playOrder
  }, [playOrder])

  useEffect(() => {
    currentTrackIndexRef.current = currentTrackIndex
  }, [currentTrackIndex])

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

  // Handle track end - auto-advance to next track
  const handleTrackEnd = useCallback(() => {
    setHasEnded(true)
    const order = playOrderRef.current
    const currentIdx = currentTrackIndexRef.current
    const currentOrderIndex = order.indexOf(currentIdx)
    const nextOrderIndex = currentOrderIndex < order.length - 1 ? currentOrderIndex + 1 : 0
    setCurrentTrackIndex(order[nextOrderIndex])
  }, [])

  // Load track when currentTrackIndex changes
  useEffect(() => {
    if (currentTrack) {
      player.load(currentTrack.url, {
        autoplay: wasPlayingRef.current,
        html5: true, // Better for streaming large files
        onend: handleTrackEnd,
      })
      onTrackChangeRef.current?.(currentTrackIndex)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrackIndex, currentTrack?.url, handleTrackEnd]) // player.load is stable

  // Poll for current time (100ms interval when playing)
  useEffect(() => {
    if (player.isPlaying) {
      wasPlayingRef.current = true
      setHasEnded(false)

      // Get initial time
      const time = player.getPosition()
      setCurrentTime(time)
      onPlaybackTimeUpdateRef.current?.(time)

      // Poll every 100ms
      const interval = setInterval(() => {
        const time = player.getPosition()
        setCurrentTime(time)
        onPlaybackTimeUpdateRef.current?.(time)
      }, 100)

      return () => clearInterval(interval)
    } else if (!player.isLoading && !player.isReady) {
      // Reset when stopped/unloaded
      wasPlayingRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.isPlaying, player.isLoading, player.isReady]) // player.getPosition is stable

  // Update time when paused (fire callback on pause)
  useEffect(() => {
    if (player.isPaused) {
      const time = player.getPosition()
      setCurrentTime(time)
      onPlaybackTimeUpdateRef.current?.(time)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.isPaused]) // player.getPosition is stable

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
  const seek = useCallback(
    (time: number) => {
      player.seek(time)
      setCurrentTime(time)
      onPlaybackTimeUpdateRef.current?.(time)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // player.seek is stable
  )

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
