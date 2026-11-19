import { useState, useEffect, useCallback, useEffectEvent, useMemo, useRef } from 'react'
import { useAudioPlayer } from './useAudioPlayer'
import type {
  Track,
  PlaylistAudioPlayerState,
  PlaylistAudioPlayerControls,
} from '../../components/molecules/AudioPlayer/types'

export interface UsePlaylistAudioPlayerOptions {
  /** Array of tracks to manage */
  tracks: Track[]
  /** Enable shuffle mode on initialization */
  shuffle?: boolean
  /** Callback fired every 100ms during playback (also on play/pause/seek) */
  onPlaybackTimeUpdate?: (currentTime: number) => void
}

/**
 * Playlist wrapper hook for useAudioPlayer.
 * Adds playlist management (tracks, shuffle, next/prev) on top of the core hook.
 *
 * Call it inside an `AudioPlayerProvider`, and hold it in whichever component
 * owns the playing track — the one that renders both the player and anything
 * else reading the track, such as a playlist or album art. It owns the index
 * outright: nothing passes one in, and a consumer asks for a track by calling
 * `selectTrack`. A second copy of the index synchronised by props is what
 * played and highlighted two different tracks (#249).
 *
 * @example
 * const [state, controls] = usePlaylistAudioPlayer({ tracks, shuffle: true })
 * // then: <AudioPlayer state={state} controls={controls} />
 * //       <Playlist currentTrackIndex={state.currentTrackIndex}
 * //                 onTrackClick={controls.selectTrack} ... />
 */
export function usePlaylistAudioPlayer({
  tracks,
  shuffle = false,
  onPlaybackTimeUpdate,
}: UsePlaylistAudioPlayerOptions): [PlaylistAudioPlayerState, PlaylistAudioPlayerControls] {
  // Core audio player hook (handles time polling, seek callbacks)
  const [playerState, playerControls] = useAudioPlayer({
    onPlaybackTimeUpdate,
  })

  // Playlist state
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isShuffleOn, setIsShuffleOn] = useState(shuffle)
  // Only the shuffle is held in state. In-order play follows `tracks` with no
  // render to catch up, and a stored copy could only fall behind it.
  const [shuffledOrder, setShuffledOrder] = useState<number[] | null>(null)

  // What the listener asked for, which a track change auto-resumes from. It
  // cannot be read back off `playerState.isPlaying`: that is false for as long
  // as a load takes, so a track change arriving inside one would load the next
  // track silent — two presses of next a fetch apart was enough (#256).
  const wantsPlaybackRef = useRef(false)

  const currentTrack = tracks[currentTrackIndex]

  // A shuffle held over a playlist of another length would index past its end,
  // so it is kept only while the two agree.
  const playOrder = useMemo(
    () =>
      shuffledOrder?.length === tracks.length ? shuffledOrder : [...Array(tracks.length).keys()],
    [shuffledOrder, tracks.length],
  )

  // Re-shuffle when shuffle turns on, or when the playlist changes under it.
  useEffect(() => {
    if (!isShuffleOn) return

    const order = [...Array(tracks.length).keys()]

    // Fisher-Yates shuffle algorithm
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }

    // eslint-disable-next-line @eslint-react/set-state-in-effect -- a shuffle is random, so it cannot run on the server; play order drives playback, never markup
    setShuffledOrder(order)
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
        autoplay: wantsPlaybackRef.current,
        onEnd: handleTrackEnd,
      })
    }
  })

  // Load track when currentTrackIndex changes
  useEffect(() => {
    loadCurrentTrack()
  }, [currentTrackIndex, currentTrack?.url])

  // The two moments a listener states what they want, and so the only writers
  // of the flag above.
  const play = () => {
    wantsPlaybackRef.current = true
    playerControls.play()
  }

  const pause = () => {
    wantsPlaybackRef.current = false
    playerControls.pause()
  }

  // shortcut: the toggle reads playback, not intent — a press during a load
  // always plays, writing `true` to the flag against the listener. Fix when
  // `playerState.isPlaying` reports intent.
  const togglePlayPause = () => (playerState.isPlaying ? pause() : play())

  // Navigation controls
  const previous = useCallback(() => {
    const currentOrderIndex = playOrder.indexOf(currentTrackIndex)
    const prevIndex = currentOrderIndex > 0 ? currentOrderIndex - 1 : playOrder.length - 1

    setCurrentTrackIndex(playOrder[prevIndex])
  }, [playOrder, currentTrackIndex])

  const next = useCallback(() => {
    const currentOrderIndex = playOrder.indexOf(currentTrackIndex)
    const nextIndex = currentOrderIndex < playOrder.length - 1 ? currentOrderIndex + 1 : 0

    setCurrentTrackIndex(playOrder[nextIndex])
  }, [playOrder, currentTrackIndex])

  const toggleShuffle = useCallback(() => {
    setIsShuffleOn((prev) => !prev)
    // Dropping the stored shuffle is what restores in-order play; the Effect
    // mints a fresh one when shuffle is what was turned on.
    setShuffledOrder(null)
  }, [])

  // Picking a track asks to hear it, so it starts playback whether or not the
  // player was already running. Copying `playerState.isPlaying` here left a
  // row click on a paused player loading the track in silence (#249). An
  // unchanged index never reaches the load effect, so that row plays through
  // `play` instead, which is also what states the intent the next load reads.
  const selectTrack = (index: number) => {
    if (index === currentTrackIndex) {
      play()

      return
    }

    wantsPlaybackRef.current = true
    setCurrentTrackIndex(index)
  }

  // Compose state
  const state: PlaylistAudioPlayerState = {
    currentTrackIndex,
    trackCount: tracks.length,
    isPlaying: playerState.isPlaying,
    currentTime: playerState.currentTime,
    duration: playerState.duration,
    volume: playerState.volume,
    isMuted: playerState.isMuted,
    isShuffleOn,
    currentTrack,
    isLoading: playerState.isLoading,
  }

  // Compose controls
  const controls: PlaylistAudioPlayerControls = {
    play,
    pause,
    togglePlayPause,
    previous,
    next,
    seek: playerControls.seek,
    setVolume: playerControls.setVolume,
    toggleMute: playerControls.toggleMute,
    unmute: playerControls.unmute,
    toggleShuffle,
    selectTrack,
  }

  return [state, controls]
}
