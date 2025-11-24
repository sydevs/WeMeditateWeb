import { useEffect, useRef, useState, useCallback } from 'react'

export interface Track {
  url: string
  title: string
  credit: string
  creditURL: string
  thumbnailURL: string
  duration: number // in seconds
  tags?: string[] // Optional tags for filtering
}

export interface UseAudioPlayerOptions {
  tracks: Track[]
  shuffle?: boolean
  initialTrackIndex?: number
  onTrackChange?: (trackIndex: number) => void
}

export interface AudioPlayerState {
  currentTrackIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isShuffleOn: boolean
  currentTrack: Track
  isLoading: boolean
  hasEnded: boolean
}

export interface AudioPlayerControls {
  play: () => void
  pause: () => void
  togglePlayPause: () => void
  previous: () => void
  next: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  selectTrack: (index: number) => void
}

/**
 * Custom hook for managing audio playback state and controls
 * Encapsulates all audio player logic using HTML5 Audio API
 */
export function useAudioPlayer({
  tracks,
  shuffle = false,
  initialTrackIndex = 0,
  onTrackChange,
}: UseAudioPlayerOptions): [AudioPlayerState, AudioPlayerControls] {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(initialTrackIndex)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isShuffleOn, setIsShuffleOn] = useState(shuffle)
  const [playOrder, setPlayOrder] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasEnded, setHasEnded] = useState(false)

  const currentTrack = tracks[currentTrackIndex]

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.preload = 'auto' // Enable preloading
    }

    const audio = audioRef.current

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      setHasEnded(true)
      next()
    }
    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleWaiting = () => setIsLoading(true)
    const handlePlaying = () => setIsLoading(false)
    const handleStalled = () => setIsLoading(true)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('stalled', handleStalled)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('stalled', handleStalled)
    }
  }, [])

  // Initialize play order
  useEffect(() => {
    if (isShuffleOn) {
      const shuffled = [...Array(tracks.length).keys()].sort(() => Math.random() - 0.5)
      setPlayOrder(shuffled)
    } else {
      setPlayOrder([...Array(tracks.length).keys()])
    }
  }, [isShuffleOn, tracks.length])

  // Handle track change
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.url
      if (isPlaying) {
        audioRef.current.play()
      }
    }
    onTrackChange?.(currentTrackIndex)
  }, [currentTrackIndex, currentTrack?.url, onTrackChange])

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const play = useCallback(() => {
    audioRef.current?.play()
    setIsPlaying(true)
    setHasEnded(false)
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])

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

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume)
    if (newVolume > 0) {
      setIsMuted(false)
    }
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted)
  }, [isMuted])

  const toggleShuffle = useCallback(() => {
    setIsShuffleOn(!isShuffleOn)
  }, [isShuffleOn])

  const selectTrack = useCallback((index: number) => {
    setCurrentTrackIndex(index)
  }, [])

  const state: AudioPlayerState = {
    currentTrackIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffleOn,
    currentTrack,
    isLoading,
    hasEnded,
  }

  const controls: AudioPlayerControls = {
    play,
    pause,
    togglePlayPause,
    previous,
    next,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    selectTrack,
  }

  return [state, controls]
}
