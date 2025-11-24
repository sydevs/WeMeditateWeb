import { ComponentProps, useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid'
import { Avatar, Button, Link } from '../../atoms'
import { SimpleLeafSvg } from '../../atoms/svgs/SimpleLeafSvg'
import { useAudioPlayer, Track } from '../../molecules/AudioPlayer/useAudioPlayer'
import founderImage from '../../../assets/smnd.webp'

export type { Track } from '../../molecules/AudioPlayer/useAudioPlayer'

// Progress circle geometry constants
const PROGRESS_RADIUS = 48
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS

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
}

/**
 * MeditationPlayer component for playing guided meditations with dynamic visuals.
 * Features a circular player with radial progress, draggable seeking, and frame-based media.
 *
 * Supports responsive layouts:
 * - Narrow: Vertical stacked layout
 * - Wide: Three-column horizontal layout with centered player
 */
export function MeditationPlayer({
  track,
  title,
  subtitle,
  frames,
  upsell,
  onPlay,
  onPause,
  className = '',
  ...props
}: MeditationPlayerProps) {
  const [state, controls] = useAudioPlayer({
    tracks: [track],
    initialTrackIndex: 0,
  })

  // Get current media frame based on playback time (memoized to avoid re-sorting on every render)
  const currentMedia = useMemo(() => {
    // Sort frames by timestamp and find the current one
    const sortedFrames = [...frames].sort((a, b) => a.timestamp - b.timestamp)

    // Find the last frame whose timestamp is less than or equal to current time
    let currentFrame = sortedFrames[0]
    for (const frame of sortedFrames) {
      if (frame.timestamp <= state.currentTime) {
        currentFrame = frame
      } else {
        break
      }
    }

    return currentFrame.media
  }, [frames, state.currentTime])

  // Play/pause handler
  const handlePlayPause = () => {
    if (state.isPlaying) {
      controls.pause()
      onPause?.()
    } else {
      controls.play()
      onPlay?.()
    }
  }

  // Progress calculations
  const progressPercent = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0
  const progressAngle = (progressPercent / 100) * 360

  // Draggable handle position (subtract 90 degrees to account for SVG rotation)
  const angle = ((progressAngle - 90) * Math.PI) / 180
  const handleX = 50 + PROGRESS_RADIUS * Math.cos(angle)
  const handleY = 50 + PROGRESS_RADIUS * Math.sin(angle)

  // State for dragging
  const [isDragging, setIsDragging] = useState(false)
  const progressRef = useRef<SVGSVGElement>(null)
  const previousAngleRef = useRef<number>(0)

  // Handle seeking via dragging the progress circle
  const handleProgressSeek = useCallback((clientX: number, clientY: number) => {
    if (!progressRef.current) return

    const rect = progressRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // Calculate angle from center
    const angle = Math.atan2(clientY - centerY, clientX - centerX)
    // Convert to degrees and normalize to 0-360
    let degrees = (angle * 180) / Math.PI + 90
    if (degrees < 0) degrees += 360

    const previousDegrees = previousAngleRef.current

    // Prevent wraparound at top of circle by detecting boundary crossings
    // Check if we're trying to wrap from end to start or vice versa
    const isWrappingForward = previousDegrees > 270 && degrees < 90
    const isWrappingBackward = previousDegrees < 90 && degrees > 270

    if (isWrappingForward) {
      // Trying to wrap from near 360° to near 0°, clamp to maximum
      degrees = 360
    } else if (isWrappingBackward) {
      // Trying to wrap from near 0° to near 360°, clamp to minimum
      degrees = 0
    } else {
      // Normal movement, clamp to valid range
      degrees = Math.max(1, Math.min(359, degrees))
    }

    // Update previous angle for next frame
    previousAngleRef.current = degrees

    // Calculate seek position as percentage
    const seekPercent = degrees / 360
    const seekTime = seekPercent * state.duration

    controls.seek(seekTime)
  }, [controls, state.duration])

  // Mouse/touch event handlers
  const handleMouseDown = useCallback(() => {
    // Initialize previous angle based on current playback position
    if (state.duration > 0) {
      const currentAngle = (state.currentTime / state.duration) * 360
      previousAngleRef.current = currentAngle
    }
    setIsDragging(true)
  }, [state.currentTime, state.duration])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    handleProgressSeek(e.clientX, e.clientY)
  }, [isDragging, handleProgressSeek])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length === 0) return
    e.preventDefault()
    const touch = e.touches[0]
    handleProgressSeek(touch.clientX, touch.clientY)
  }, [isDragging, handleProgressSeek])

  const handleMouseUp = () => setIsDragging(false)

  // Add/remove event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove, { passive: false })
      window.addEventListener('touchend', handleMouseUp)
    } else {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove])

  return (
    <div
      className={`@container w-full min-h-screen flex items-center justify-center bg-linear-to-b from-transparent via-teal-200/60 to-transparent ${className}`}
      {...props}
    >
      <div className="w-full max-w-7xl mx-auto px-6 py-8">
        {/* Unified responsive grid layout */}
        <div className="grid grid-cols-1 @4xl:grid-cols-12 gap-6 @4xl:gap-8 @4xl:items-center">

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
                    handleMouseDown()
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation()
                    handleMouseDown()
                  }}
                >
                  {/* Visual handle - smaller than clickable area */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-3 h-3 rounded-full bg-teal-700 border border-white shadow-lg" />
                  </div>
                </div>
              </div>

              {/* Remaining Time */}
              <div className="flex justify-center mt-4 @4xl:mt-6">
                <span className="text-base @4xl:text-lg font-number text-gray-700">
                  {formatTime(state.duration - state.currentTime)}
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
            <div className="mb-6 @4xl:mb-8">
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
