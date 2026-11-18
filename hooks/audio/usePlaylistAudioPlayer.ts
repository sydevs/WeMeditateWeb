import { useState, useEffect, useCallback, useEffectEvent, useRef } from 'react'
import { useAudioPlayer } from './useAudioPlayer'
import type { Track, PlaylistAudioPlayerState, PlaylistAudioPlayerControls } from '../../components/molecules/AudioPlayer/types'

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
 * Playlist wrapper hook for useAudioPlayer.
 * Adds playlist management (tracks, shuffle, next/prev) on top of the core hook.
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
  // Core audio player hook (handles time polling, seek callbacks)
  const [playerState, playerControls] = useAudioPlayer({
    onPlaybackTimeUpdate,
  })

  // Playlist state
  const [currentTrackIndex, setCurrentTrackIndex] = useState(initialTrackIndex)
  const [isShuffleOn, setIsShuffleOn] = useState(shuffle)
  const [playOrder, setPlayOrder] = useState<number[]>([])
  const [hasEnded, setHasEnded] = useState(false)

  // Ref that tracks whether audio was playing before a track change (for auto-resume)
  const wasPlayingRef = useRef(false)

  const currentTrack = tracks[currentTrackIndex]

  // Initialize/update play order when shuffle changes or tracks change
  useEffect(() => {
    const order = [...Array(tracks.length).keys()]

    if (isShuffleOn) {
      // Fisher-Yates shuffle algorithm
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[order[i], order[j]] = [order[j], order[i]]
      }
    }

    // eslint-disable-next-line @eslint-react/set-state-in-effect -- a shuffle is random, so it cannot run on the server; play order drives playback, never markup
    setPlayOrder(order)
  }, [isShuffleOn, tracks.length])

  // Howler holds this callback from the load that registered it and fires it
  // when the track ends, so it reads the order through a ref. An Effect Event
  // cannot carry it: it is passed into `load`, never called from an Effect.
  const playOrderRef = useRef(playOrder)

  useEffect(() => {
    playOrderRef.current = playOrder
  }, [playOrder])

  // Advances to the next track in play order.
  const handleTrackEnd = () => {
    setHasEnded(true)
    setCurrentTrackIndex((current) => {
      const order = playOrderRef.current
      const at = order.indexOf(current)

      return order[at < order.length - 1 ? at + 1 : 0]
    })
  }

  // Effect Event that loads the current track
  const loadCurrentTrack = useEffectEvent(() => {
    if (currentTrack) {
      playerControls.load(currentTrack.url, {
        autoplay: wasPlayingRef.current,
        onEnd: handleTrackEnd,
      })
      onTrackChange?.(currentTrackIndex)
    }
  })

  // Load track when currentTrackIndex changes
  useEffect(() => {
    loadCurrentTrack()
  }, [currentTrackIndex, currentTrack?.url])

  // Track playing state for auto-resume logic
  useEffect(() => {
    if (playerState.isPlaying) {
      wasPlayingRef.current = true
      // eslint-disable-next-line @eslint-react/set-state-in-effect -- Howler reports playback starting, and an effect is the only place that event reaches React
      setHasEnded(false)
    } else if (!playerState.isLoading && !playerState.isReady) {
      // Reset when stopped/unloaded
      wasPlayingRef.current = false
    }
  }, [playerState.isPlaying, playerState.isLoading, playerState.isReady])

  // Navigation controls
  const previous = useCallback(() => {
    const currentOrderIndex = playOrder.indexOf(currentTrackIndex)
    const prevIndex = currentOrderIndex > 0 ? currentOrderIndex - 1 : playOrder.length - 1
    wasPlayingRef.current = playerState.isPlaying
    setCurrentTrackIndex(playOrder[prevIndex])
  }, [playOrder, currentTrackIndex, playerState.isPlaying])

  const next = useCallback(() => {
    const currentOrderIndex = playOrder.indexOf(currentTrackIndex)
    const nextIndex = currentOrderIndex < playOrder.length - 1 ? currentOrderIndex + 1 : 0
    wasPlayingRef.current = playerState.isPlaying
    setCurrentTrackIndex(playOrder[nextIndex])
  }, [playOrder, currentTrackIndex, playerState.isPlaying])

  const toggleShuffle = useCallback(() => {
    setIsShuffleOn((prev) => !prev)
  }, [])

  const selectTrack = useCallback(
    (index: number) => {
      wasPlayingRef.current = playerState.isPlaying
      setCurrentTrackIndex(index)
    },
    [playerState.isPlaying]
  )

  // Compose state
  const state: PlaylistAudioPlayerState = {
    currentTrackIndex,
    isPlaying: playerState.isPlaying,
    currentTime: playerState.currentTime,
    duration: playerState.duration,
    volume: playerState.volume,
    isMuted: playerState.isMuted,
    isShuffleOn,
    currentTrack,
    isLoading: playerState.isLoading,
    hasEnded,
  }

  // Compose controls
  const controls: PlaylistAudioPlayerControls = {
    play: playerControls.play,
    pause: playerControls.pause,
    togglePlayPause: playerControls.togglePlayPause,
    previous,
    next,
    seek: playerControls.seek,
    setVolume: playerControls.setVolume,
    toggleMute: playerControls.toggleMute,
    toggleShuffle,
    selectTrack,
  }

  return [state, controls]
}
