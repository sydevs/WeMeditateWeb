import {
  ComponentProps,
  ReactNode,
  useMemo,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react'
import { AudioPlayerProvider } from 'react-use-audio-player'
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowPathRoundedSquareIcon,
} from '@heroicons/react/24/solid'
import { Avatar, Button, Dropdown, Link } from '../../atoms'
import { SimpleLeafSvg } from '../../atoms/svgs/SimpleLeafSvg'
import { useCircularProgress } from './useCircularProgress'
import { pickRandomIndex, pickNextRandomIndex } from './musicSelection'
import { useAudioPlayer } from '../../../hooks/audio'
import type { Track } from '../../molecules/AudioPlayer/types'
import type { MeditationSong } from '../../../server/cms-types'
import founderImage from '../../../assets/smnd.webp'

export type { Track } from '../../molecules/AudioPlayer/types'

// Progress circle geometry constants
const PROGRESS_RADIUS = 48
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS

// Default background-music level — sits clearly under the guided voice (~1.0).
const DEFAULT_MUSIC_VOLUME = 0.4

// Placeholder image for when no frames are available (teal gradient)
const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,' +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <defs>
      <radialGradient id="g" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="#5eead4"/>
        <stop offset="100%" stop-color="#0d9488"/>
      </radialGradient>
    </defs>
    <rect width="400" height="400" fill="url(#g)"/>
  </svg>
`)

/**
 * Format time in seconds to MM:SS format
 */
function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export interface MeditationFrame {
  /**
   * Timestamp in seconds when this frame should be displayed
   */
  timestamp: number
  /**
   * Media to display (image or video)
   */
  media: {
    type: 'image' | 'video'
    src: string
    /**
     * Optional fallback source (e.g., MP4) when primary HLS source isn't supported.
     */
    fallbackSrc?: string
    /**
     * Optional duration (seconds) from CMS metadata.
     */
    duration?: number
  }
}

export interface MeditationPlayerProps extends Omit<ComponentProps<'div'>, 'title'> {
  /**
   * Audio track to play
   */
  track: Track
  /**
   * Optional subtitle
   */
  subtitle?: string
  /**
   * Array of frames that change based on playback time
   */
  frames: MeditationFrame[]
  /**
   * Background-music tracks layered under the guided voice. One is auto-selected
   * (with a shuffle control to switch). When empty, the player is voice-only and
   * the Music slider / shuffle button are hidden.
   * @default []
   */
  musicTracks?: MeditationSong[]
  /**
   * Optional upsell message variant
   * - 'web': Link to more meditations on wemeditate.com
   * - 'app': Link to interactive meditations in the free app
   * - undefined: No upsell shown
   */
  upsell?: 'web' | 'app'
  /**
   * Callback when playback starts
   */
  onPlay?: () => void
  /**
   * Callback when playback pauses
   */
  onPause?: () => void
  /**
   * Callback fired every 100ms during playback with current time in seconds
   * Also fired on play, pause, and seek events
   */
  onPlaybackTimeUpdate?: (currentTime: number) => void
  /**
   * How to display time: 'countdown' shows remaining time, 'elapsed' shows current position
   * @default 'countdown'
   */
  timeDisplay?: 'countdown' | 'elapsed'
  /**
   * External seek command. When provided, the player will seek to the specified timestamp.
   * Uses { timestamp, id } format so each command is unique, allowing repeated seeks to the same position.
   */
  seekTo?: { timestamp: number; id: number } | null
}

interface VolumeRowProps {
  /** Visible label (e.g. "Voice", "Music"); also drives the control aria-labels. */
  label: string
  /** Optional secondary text shown next to the label (e.g. the music track title). */
  sublabel?: string
  /** Current volume 0–1. */
  volume: number
  /** Whether this channel is muted (slider reads 0 while muted). */
  muted: boolean
  onVolumeChange: (volume: number) => void
  onToggleMute: () => void
  /** Optional trailing control (e.g. the music shuffle button). */
  action?: ReactNode
}

/**
 * One labeled volume channel inside the audio popover: a mute toggle, a slider,
 * and an optional trailing action. Used for both the Voice and Music channels so
 * the two stay visually consistent and independently mutable.
 */
function VolumeRow({
  label,
  sublabel,
  volume,
  muted,
  onVolumeChange,
  onToggleMute,
  action,
}: VolumeRowProps) {
  const labelLower = label.toLowerCase()

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
        {label}
        {sublabel ? (
          <span className="ml-1 font-normal normal-case text-gray-400">· {sublabel}</span>
        ) : null}
      </p>
      <div className="flex items-center gap-2">
        <Button
          aria-label={muted ? `Unmute ${labelLower}` : `Mute ${labelLower}`}
          icon={muted ? SpeakerXMarkIcon : SpeakerWaveIcon}
          size="md"
          variant="ghost"
          onClick={onToggleMute}
        />
        <input
          aria-label={`${label} volume`}
          className="h-1 flex-1 cursor-pointer appearance-none rounded-lg bg-gray-300 accent-teal-600"
          max="1"
          min="0"
          step="0.01"
          type="range"
          value={muted ? 0 : volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        />
        {action}
      </div>
    </div>
  )
}

interface AudioControlsProps {
  /** Guided-voice volume (0–1) and mute state, plus their setters. */
  voiceVolume: number
  voiceMuted: boolean
  onVoiceVolumeChange: (volume: number) => void
  onToggleVoiceMute: () => void
  /** Whether any background music is available — gates the Music row entirely. */
  hasMusic: boolean
  musicVolume: number
  musicMuted: boolean
  /** Title of the currently selected music track (shown beside the Music label). */
  musicTrackTitle?: string
  /** Whether shuffle is offered (only when more than one track exists). */
  canShuffle: boolean
  onMusicVolumeChange: (volume: number) => void
  onToggleMusicMute: () => void
  onShuffle: () => void
}

/**
 * Speaker button that opens a popover (above and centered on the trigger via the
 * shared Dropdown atom, which keeps it on-screen near viewport edges) holding
 * independent Voice and Music volume sliders — each with its own mute toggle —
 * and a shuffle button for the music track. The Music row is hidden when no
 * songs are available; the speaker icon reflects the voice mute state.
 */
function AudioControls({
  voiceVolume,
  voiceMuted,
  onVoiceVolumeChange,
  onToggleVoiceMute,
  hasMusic,
  musicVolume,
  musicMuted,
  musicTrackTitle,
  canShuffle,
  onMusicVolumeChange,
  onToggleMusicMute,
  onShuffle,
}: AudioControlsProps) {
  return (
    <Dropdown
      align="center"
      ariaLabel="Audio settings"
      role="dialog"
      side="top"
      trigger={
        <Button
          aria-label="Audio settings"
          icon={voiceMuted ? SpeakerXMarkIcon : SpeakerWaveIcon}
          size="lg"
          variant="ghost"
          // The Dropdown wrapper is the focusable trigger (role=button,
          // aria-expanded); keep this inner button out of the tab order.
          tabIndex={-1}
        />
      }
    >
      <div className="flex w-64 flex-col gap-4 p-4 text-left">
        <VolumeRow
          label="Voice"
          muted={voiceMuted}
          volume={voiceVolume}
          onToggleMute={onToggleVoiceMute}
          onVolumeChange={onVoiceVolumeChange}
        />

        {hasMusic && (
          <VolumeRow
            action={
              canShuffle ? (
                <Button
                  aria-label="Shuffle music track"
                  icon={ArrowPathRoundedSquareIcon}
                  size="md"
                  variant="ghost"
                  onClick={onShuffle}
                />
              ) : undefined
            }
            label="Music"
            muted={musicMuted}
            sublabel={musicTrackTitle}
            volume={musicVolume}
            onToggleMute={onToggleMusicMute}
            onVolumeChange={onMusicVolumeChange}
          />
        )}
      </div>
    </Dropdown>
  )
}

/**
 * MeditationPlayer component for playing guided meditations with dynamic visuals.
 * Features a circular player with radial progress, draggable seeking, and frame-based media.
 *
 * Built on react-use-audio-player (Howler.js) for reliable cross-browser audio.
 *
 * Supports responsive layouts:
 * - Narrow: Vertical stacked layout
 * - Wide: Three-column horizontal layout with centered player
 *
 * @example
 * // Basic usage
 * <MeditationPlayer
 *   track={{
 *     url: '/audio/meditation.mp3',
 *     title: 'Morning Meditation',
 *     credit: 'Shri Mataji',
 *     creditURL: '',
 *     thumbnailURL: '/images/thumb.jpg',
 *     duration: 0
 *   }}
 *   subtitle="Start your day with clarity"
 *   frames={[
 *     { timestamp: 0, media: { type: 'image', src: '/frame1.jpg' } },
 *     { timestamp: 30, media: { type: 'video', src: '/frame2.mp4' } }
 *   ]}
 * />
 *
 * @example
 * // With playback time tracking for live preview
 * const handlePlaybackUpdate = (currentTime: number) => {
 *   console.log(`Currently at ${currentTime} seconds`)
 *   // Send to parent window for frame highlighting
 *   window.parent.postMessage({
 *     type: 'PLAYBACK_TIME_UPDATE',
 *     currentTime: Math.floor(currentTime)
 *   }, targetOrigin)
 * }
 *
 * <MeditationPlayer
 *   track={track}
 *   frames={frames}
 *   onPlaybackTimeUpdate={handlePlaybackUpdate}
 * />
 */
function MeditationPlayerInner({
  track,
  subtitle,
  frames,
  musicTracks = [],
  upsell,
  onPlay,
  onPause,
  onPlaybackTimeUpdate,
  timeDisplay = 'countdown',
  seekTo,
  className = '',
  ...props
}: MeditationPlayerProps) {
  // Core audio player hook (handles time polling, seek callbacks, track loading)
  const [state, controls] = useAudioPlayer({
    url: track.url,
    onPlay,
    onPause,
    onPlaybackTimeUpdate,
  })

  const effectiveDuration = state.duration > 0 ? state.duration : track.duration

  // --- Background-music layer (optional, mixed under the guided voice) ---
  const hasMusic = musicTracks.length > 0
  const [musicIndex, setMusicIndex] = useState(0)
  const [musicVolume, setMusicVolume] = useState(DEFAULT_MUSIC_VOLUME)
  const [musicMuted, setMusicMuted] = useState(false)
  const musicRef = useRef<HTMLAudioElement | null>(null)
  // Clamp the index so a track list that ever shrinks (without the index being
  // reset yet) can't index past the end and silently drop the music layer.
  const safeMusicIndex = hasMusic ? Math.min(musicIndex, musicTracks.length - 1) : 0
  const currentMusicTrack = hasMusic ? musicTracks[safeMusicIndex] : undefined
  const currentMusicUrl = currentMusicTrack?.url

  // On mount, start from a random track. The endpoint already returns songs in
  // randomized order (so SSR's docs[0] is itself random per cache window); this
  // adds per-load variety on the client with no SSR/hydration mismatch, and runs
  // before playback so the source swap is inaudible.
  useEffect(() => {
    if (musicTracks.length > 1) {
      setMusicIndex(pickRandomIndex(musicTracks.length))
    }
  }, [musicTracks])

  // Tie the music layer's play/pause to the meditation's. Re-runs when the track
  // changes (shuffle) so the new source resumes if the meditation is playing.
  useEffect(() => {
    const el = musicRef.current

    if (!el || !hasMusic) return

    if (state.isPlaying) {
      const playPromise = el.play()

      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {})
      }
    } else {
      el.pause()
    }
  }, [state.isPlaying, hasMusic, currentMusicUrl])

  // Keep the music element's volume/mute in sync, independent of the voice track.
  // No need to react to the track URL: an <audio> element preserves its volume
  // and muted properties across a src swap, so this stays correct after a shuffle.
  useEffect(() => {
    const el = musicRef.current

    if (!el) return

    el.volume = musicVolume
    el.muted = musicMuted
  }, [musicVolume, musicMuted])

  // Shuffle to a different random track (no immediate repeat); playback continues
  // seamlessly via the sync effect above when the source changes.
  const handleShuffle = useCallback(() => {
    setMusicIndex((current) => pickNextRandomIndex(musicTracks.length, current))
  }, [musicTracks.length])

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lastAudioTimeRef = useRef(0)
  const lastFrameKeyRef = useRef<string | null>(null)
  const pendingSeekRef = useRef<number | null>(null)

  // Seek handler wrapped in useCallback for stable reference in useCircularProgress
  const handleSeek = useCallback(
    (time: number) => {
      controls.seek(time)
    },
    [controls],
  )

  const applyExternalSeek = useEffectEvent((timestamp: number) => {
    controls.seek(timestamp)
  })

  // Handle external seek commands (e.g., from postMessage in preview mode)
  // Depends on entire seekTo object so it fires when id changes (even for same timestamp)
  useEffect(() => {
    if (seekTo) {
      applyExternalSeek(seekTo.timestamp)
    }
  }, [seekTo?.id])

  // Circular progress hook handles all drag and coordinate calculation logic
  const { progressRef, displayTime, isDragging, startDrag } = useCircularProgress({
    currentTime: state.currentTime,
    duration: effectiveDuration,
    onSeek: handleSeek,
  })

  const timeForSync = isDragging ? displayTime : state.currentTime

  // Get current media frame based on display time (memoized to avoid re-sorting on every render)
  // Uses displayTime so frames update during drag
  const currentFrame = useMemo(() => {
    // Handle empty frames array with placeholder
    if (!frames || frames.length === 0) {
      return { timestamp: 0, media: { type: 'image' as const, src: PLACEHOLDER_IMAGE } }
    }

    // Sort frames by timestamp and find the current one
    const sortedFrames = [...frames].sort((a, b) => a.timestamp - b.timestamp)

    // Find the last frame whose timestamp is less than or equal to display time
    let currentFrame = sortedFrames[0]

    for (const frame of sortedFrames) {
      if (frame.timestamp <= timeForSync) {
        currentFrame = frame
      } else {
        break
      }
    }

    // Fallback to placeholder if frame has no media (defensive handling for incomplete CMS data)
    return {
      timestamp: currentFrame.timestamp,
      media: currentFrame.media ?? { type: 'image' as const, src: PLACEHOLDER_IMAGE },
    }
  }, [frames, timeForSync])

  const currentMedia = currentFrame.media
  const isHlsSource =
    currentMedia.type === 'video' && currentMedia.src.split('?')[0].endsWith('.m3u8')
  const frameKey =
    currentMedia.type === 'video'
      ? `${currentFrame.timestamp}|${currentMedia.src}|${currentMedia.fallbackSrc ?? ''}`
      : null

  // Apply any pending seek once metadata is available
  useEffect(() => {
    const video = videoRef.current

    if (!video) return

    const handleLoadedMetadata = () => {
      if (pendingSeekRef.current !== null) {
        const target = pendingSeekRef.current

        pendingSeekRef.current = null
        try {
          video.currentTime = target
        } catch {
          // Ignore seek errors until the stream is ready
        }
      }
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata)
  }, [frameKey])

  // Keep video frames synchronized to the audio timeline
  useEffect(() => {
    const video = videoRef.current

    if (!video || currentMedia.type !== 'video') {
      lastFrameKeyRef.current = null

      return
    }

    const audioTime = timeForSync
    const frameStart = currentFrame.timestamp ?? 0
    const relativeTime = Math.max(0, audioTime - frameStart)

    const mediaDuration =
      Number.isFinite(video.duration) && video.duration > 0
        ? video.duration
        : typeof currentMedia.duration === 'number' && currentMedia.duration > 0
          ? currentMedia.duration
          : null

    const targetTime = mediaDuration ? relativeTime % mediaDuration : relativeTime
    const isFrameChange = frameKey !== lastFrameKeyRef.current
    const isSeek = Math.abs(audioTime - lastAudioTimeRef.current) > 0.5 || isDragging
    const shouldSnap = !state.isPlaying || isSeek || isFrameChange

    if (shouldSnap && Number.isFinite(targetTime)) {
      const diff = Math.abs(video.currentTime - targetTime)

      if (diff > 0.2) {
        if (video.readyState >= 1) {
          try {
            video.currentTime = targetTime
          } catch {
            // Ignore seek errors until the stream is ready
          }
        } else {
          pendingSeekRef.current = targetTime
        }
      }
    }

    if (state.isPlaying) {
      const playPromise = video.play()

      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {})
      }
    } else {
      video.pause()
    }

    lastAudioTimeRef.current = audioTime
    lastFrameKeyRef.current = frameKey
  }, [currentMedia, currentFrame.timestamp, timeForSync, state.isPlaying, isDragging, frameKey])

  // Play/pause handler
  const handlePlayPause = () => {
    if (state.isPlaying) {
      controls.pause()
    } else {
      controls.play()
    }
  }

  // Progress calculations - use displayTime for visual updates during drag
  const progressPercent = effectiveDuration > 0 ? (displayTime / effectiveDuration) * 100 : 0
  const progressAngle = (progressPercent / 100) * 360

  // Draggable handle position (subtract 90 degrees to account for SVG rotation)
  const angle = ((progressAngle - 90) * Math.PI) / 180
  const handleX = 50 + PROGRESS_RADIUS * Math.cos(angle)
  const handleY = 50 + PROGRESS_RADIUS * Math.sin(angle)

  return (
    <div
      className={`@container w-full h-full min-h-0 flex items-center justify-center bg-linear-to-b from-transparent via-teal-200/60 to-transparent ${className}`}
      {...props}
    >
      {/* Background-music layer: a hidden, looping <audio> mixed under the guided
          voice. Its play/pause, volume and mute are driven by the effects above. */}
      {currentMusicTrack && (
        <audio ref={musicRef} loop aria-hidden="true" preload="none" src={currentMusicTrack.url} />
      )}

      <div className="w-full max-w-7xl mx-auto px-6 py-4 flex-1 min-h-0 flex flex-col justify-center">
        {/* Unified responsive grid layout */}
        <div className="grid grid-cols-1 @4xl:grid-cols-12 gap-4 @4xl:items-center">
          {/* Label + Founder Info - Top on narrow, right on wide */}
          <div className="flex items-start justify-between @4xl:col-span-3 @4xl:flex-col @4xl:items-end @4xl:justify-start @4xl:order-3 @4xl:space-y-4">
            <div className="@4xl:hidden">
              <p className="text-xs sm:text-sm tracking-widest text-gray-600 uppercase">
                Meditation
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Avatar
                alt="Shri Mataji Nirmala Devi"
                className="@4xl:w-32 @4xl:h-32"
                shape="circle"
                size="xl"
                src={founderImage}
              />
              <div className="text-right">
                <p className="text-xs @4xl:text-sm font-medium text-gray-800">
                  Shri Mataji
                  <br />
                  Nirmala Devi
                </p>
                <p className="text-xs @4xl:text-sm italic text-gray-600">founder</p>
              </div>
            </div>
          </div>

          {/* Circular Player - Center on both */}
          <div className="@4xl:col-span-6 @4xl:order-2">
            <div className="relative">
              {/* Container for circular player */}
              <div className="w-full max-w-sm @4xl:max-w-lg mx-auto aspect-square rounded-full relative">
                {/* Image/Video container - clickable circular area */}
                <div
                  className="group absolute inset-2 rounded-full bg-white overflow-hidden z-0 cursor-pointer border-4 border-white select-none"
                  onClick={handlePlayPause}
                >
                  {currentMedia.type === 'video' ? (
                    <video
                      key={frameKey}
                      ref={videoRef}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                      draggable={false}
                    >
                      <source
                        src={currentMedia.src}
                        type={isHlsSource ? 'application/x-mpegURL' : undefined}
                      />
                      {currentMedia.fallbackSrc ? (
                        <source src={currentMedia.fallbackSrc} type="video/mp4" />
                      ) : null}
                    </video>
                  ) : (
                    <img
                      alt={track.title}
                      className="w-full h-full object-cover"
                      draggable={false}
                      src={currentMedia.src}
                    />
                  )}

                  {/* Teal overlay when paused or loading */}
                  {(!state.isPlaying || state.isLoading) && (
                    <div className="absolute inset-0 bg-teal-700/20" />
                  )}

                  {/* Play/Pause Button - Fades in/out when paused or hovering */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${!state.isPlaying || state.isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none group-hover:opacity-100'}`}
                  >
                    <Button
                      aria-label={state.isPlaying ? 'Pause' : 'Play'}
                      className="border-0 shadow-2xl"
                      icon={state.isPlaying ? PauseIcon : PlayIcon}
                      isLoading={state.isLoading}
                      shape="circular"
                      size="lg"
                      variant="neutral"
                      onClick={(event) => {
                        event.stopPropagation()
                        handlePlayPause()
                      }}
                    />
                  </div>
                </div>

                {/* Radial progress track (SVG circle) */}
                <svg
                  ref={progressRef}
                  className="absolute inset-0 w-full h-full -rotate-90 z-20 pointer-events-none select-none"
                  viewBox="0 0 100 100"
                >
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    fill="none"
                    r={PROGRESS_RADIUS}
                    stroke="#0f766e"
                    strokeDasharray={`${(progressPercent / 100) * PROGRESS_CIRCUMFERENCE} ${PROGRESS_CIRCUMFERENCE}`}
                    strokeWidth="1.5"
                  />
                </svg>

                {/* SimpleLeafSvg at top of progress circle */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-25 text-teal-700 pointer-events-none">
                  <SimpleLeafSvg className="w-6 h-6" />
                </div>

                {/* Draggable handle at end of progress - larger click area for better touch/mouse interaction */}
                <div
                  className="absolute w-11 h-11 cursor-grab active:cursor-grabbing -translate-1/2 z-15"
                  style={{
                    left: `${handleX}%`,
                    top: `${handleY}%`,
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    startDrag()
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation()
                    startDrag()
                  }}
                >
                  {/* Visual handle - smaller than clickable area */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-3 h-3 rounded-full bg-teal-700 border border-white shadow-lg" />
                  </div>
                </div>
              </div>

              {/* Time Display */}
              <div className="flex justify-center mt-2">
                <span className="text-base @4xl:text-lg font-number text-gray-700">
                  {formatTime(
                    timeDisplay === 'countdown'
                      ? Math.max(0, effectiveDuration - displayTime)
                      : displayTime,
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Subtitle + Volume - Below player on narrow, left column on wide */}
          <div className="text-center @4xl:text-left @4xl:col-span-3 @4xl:order-1 @4xl:space-y-6">
            {/* Label - hidden on narrow, visible on wide */}
            <p className="hidden @4xl:block text-sm tracking-widest text-gray-600 uppercase mb-8">
              Meditation
            </p>

            {subtitle && (
              <p className="mb-4 text-sm sm:text-base font-light text-gray-700">{subtitle}</p>
            )}

            {/* Audio controls: speaker button → popover with Voice + Music sliders */}
            <div className="flex items-center justify-center @4xl:justify-start">
              <AudioControls
                canShuffle={musicTracks.length > 1}
                hasMusic={hasMusic}
                musicMuted={musicMuted}
                musicTrackTitle={currentMusicTrack?.title || undefined}
                musicVolume={musicVolume}
                voiceMuted={state.isMuted}
                voiceVolume={state.volume}
                onMusicVolumeChange={setMusicVolume}
                onShuffle={handleShuffle}
                onToggleMusicMute={() => setMusicMuted((muted) => !muted)}
                onToggleVoiceMute={controls.toggleMute}
                onVoiceVolumeChange={controls.setVolume}
              />
            </div>
          </div>
        </div>

        {/* Upsell Message */}
        {upsell && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              {upsell === 'web' ? (
                <>
                  Find more meditations on{' '}
                  <Link external href="https://wemeditate.com/meditations" variant="primary">
                    wemeditate.com
                  </Link>
                </>
              ) : (
                <>
                  Find interactive meditations with meditation music in our{' '}
                  <Link external href="https://wemeditate.com/app" variant="primary">
                    free app
                  </Link>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * MeditationPlayer with AudioPlayerProvider context wrapper
 */
export function MeditationPlayer(props: MeditationPlayerProps) {
  return (
    <AudioPlayerProvider>
      <MeditationPlayerInner {...props} />
    </AudioPlayerProvider>
  )
}
