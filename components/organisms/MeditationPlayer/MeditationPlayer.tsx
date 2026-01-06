import { ComponentProps, useMemo, useCallback } from 'react'
import { AudioPlayerProvider } from 'react-use-audio-player'
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid'
import { Avatar, Button, Link } from '../../atoms'
import { SimpleLeafSvg } from '../../atoms/svgs/SimpleLeafSvg'
import { useCircularProgress } from './useCircularProgress'
import { useAudioPlayer } from '../../../hooks/audio'
import type { Track } from '../../molecules/AudioPlayer/types'
import founderImage from '../../../assets/smnd.webp'

export type { Track } from '../../molecules/AudioPlayer/types'

// Progress circle geometry constants
const PROGRESS_RADIUS = 48
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS

// Placeholder image for when no frames are available (teal gradient)
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(`
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
  }
}

export interface MeditationPlayerProps extends ComponentProps<'div'> {
  /**
   * Audio track to play
   */
  track: Track
  /**
   * Meditation title
   */
  title: string
  /**
   * Optional subtitle
   */
  subtitle?: string
  /**
   * Array of frames that change based on playback time
   */
  frames: MeditationFrame[]
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
 *   title="Morning Meditation"
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
 *   title="Meditation"
 *   frames={frames}
 *   onPlaybackTimeUpdate={handlePlaybackUpdate}
 * />
 */
function MeditationPlayerInner({
  track,
  title,
  subtitle,
  frames,
  upsell,
  onPlay,
  onPause,
  onPlaybackTimeUpdate,
  timeDisplay = 'countdown',
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

  // Seek handler for circular progress - use controls.seek directly to avoid dependency issues
  const handleSeek = useCallback((time: number) => {
    controls.seek(time)
  }, [controls])

  // Circular progress hook handles all drag and coordinate calculation logic
  const { progressRef, displayTime, isDragging, startDrag } = useCircularProgress({
    currentTime: state.currentTime,
    duration: state.duration,
    onSeek: handleSeek,
  })

  // Get current media frame based on display time (memoized to avoid re-sorting on every render)
  // Uses displayTime so frames update during drag
  const currentMedia = useMemo(() => {
    // Handle empty frames array with placeholder
    if (!frames || frames.length === 0) {
      return { type: 'image' as const, src: PLACEHOLDER_IMAGE }
    }

    // Sort frames by timestamp and find the current one
    const sortedFrames = [...frames].sort((a, b) => a.timestamp - b.timestamp)

    // Find the last frame whose timestamp is less than or equal to display time
    let currentFrame = sortedFrames[0]
    for (const frame of sortedFrames) {
      if (frame.timestamp <= displayTime) {
        currentFrame = frame
      } else {
        break
      }
    }

    // Fallback to placeholder if frame has no media (defensive handling for incomplete CMS data)
    return currentFrame.media ?? { type: 'image' as const, src: PLACEHOLDER_IMAGE }
  }, [frames, displayTime])

  // Play/pause handler
  const handlePlayPause = () => {
    if (state.isPlaying) {
      controls.pause()
    } else {
      controls.play()
    }
  }

  // Progress calculations - use displayTime for visual updates during drag
  const progressPercent = state.duration > 0 ? (displayTime / state.duration) * 100 : 0
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
                src={founderImage}
                alt="Shri Mataji Nirmala Devi"
                size="xl"
                className="@4xl:w-32 @4xl:h-32"
                shape="circle"
              />
              <div className="text-right">
                <p className="text-xs @4xl:text-sm font-medium text-gray-800">
                  Shri Mataji<br />Nirmala Devi
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
                      src={currentMedia.src}
                      autoPlay
                      loop
                      muted
                      playsInline
                      draggable={false}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={currentMedia.src}
                      alt={title}
                      draggable={false}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Teal overlay when paused or loading */}
                  {(!state.isPlaying || state.isLoading) && (
                    <div className="absolute inset-0 bg-teal-700/20" />
                  )}

                  {/* Play/Pause Button - Fades in/out when paused or hovering */}
                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${!state.isPlaying || state.isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none group-hover:opacity-100'}`}>
                    <Button
                      icon={state.isPlaying ? PauseIcon : PlayIcon}
                      variant="neutral"
                      shape="circular"
                      size="lg"
                      onClick={handlePlayPause}
                      isLoading={state.isLoading}
                      aria-label={state.isPlaying ? 'Pause' : 'Play'}
                      className="border-0 shadow-2xl"
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
                    r={PROGRESS_RADIUS}
                    fill="none"
                    stroke="#0f766e"
                    strokeWidth="1.5"
                    strokeDasharray={`${(progressPercent / 100) * PROGRESS_CIRCUMFERENCE} ${PROGRESS_CIRCUMFERENCE}`}
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
                  {formatTime(timeDisplay === 'countdown' ? state.duration - displayTime : displayTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Title/Subtitle + Volume - Below player on narrow, left column on wide */}
          <div className="text-center @4xl:text-left @4xl:col-span-3 @4xl:order-1 @4xl:space-y-6">
            {/* Label - hidden on narrow, visible on wide */}
            <p className="hidden @4xl:block text-sm tracking-widest text-gray-600 uppercase mb-8">
              Meditation
            </p>

            {/* Title and Subtitle */}
            <div className="mb-4">
              <h1 className="text-lg sm:text-xl @4xl:text-2xl font-medium text-gray-900 mb-2 @4xl:mb-4">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm sm:text-base font-light text-gray-700">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Volume Control */}
            <div className="flex items-center justify-center @4xl:justify-start gap-2">
              <Button
                icon={state.isMuted ? SpeakerXMarkIcon : SpeakerWaveIcon}
                variant="ghost"
                size="lg"
                onClick={controls.toggleMute}
                aria-label={state.isMuted ? 'Unmute' : 'Mute'}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.isMuted ? 0 : state.volume}
                onChange={(e) => controls.setVolume(parseFloat(e.target.value))}
                className="w-24 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-teal-600"
                aria-label="Volume"
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
                  <Link href="https://wemeditate.com/meditations" variant="primary" external>
                    wemeditate.com
                  </Link>
                </>
              ) : (
                <>
                  Find interactive meditations with meditation music in our{' '}
                  <Link href="https://wemeditate.com/app" variant="primary" external>
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
