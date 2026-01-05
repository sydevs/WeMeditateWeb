import { useState, useEffect, useCallback, useRef, type RefObject } from 'react'

interface UseCircularProgressOptions {
  /** Current playback time from audio player */
  currentTime: number
  /** Total duration for clamping seek position */
  duration: number
  /** Callback to perform actual seek when drag ends */
  onSeek: (time: number) => void
}

interface UseCircularProgressReturn {
  /** Ref to attach to the SVG element */
  progressRef: RefObject<SVGSVGElement | null>
  /** Time to display (seekPosition during drag, currentTime otherwise) */
  displayTime: number
  /** Whether user is currently dragging */
  isDragging: boolean
  /** Call on mousedown/touchstart on the progress handle */
  startDrag: () => void
}

/**
 * Hook for managing circular progress bar state during drag interactions.
 *
 * Handles all circular-specific logic including:
 * - Polar coordinate calculations for angle-to-time conversion
 * - Wraparound prevention at the top of the circle (0°/360° boundary)
 * - Drag state management with seek-on-release
 * - Race condition prevention between drag events and audio timeupdate
 *
 * Based on patterns from react-h5-audio-player:
 * @see https://github.com/lhz516/react-h5-audio-player/blob/master/src/ProgressBar.tsx
 */
export function useCircularProgress({
  currentTime,
  duration,
  onSeek,
}: UseCircularProgressOptions): UseCircularProgressReturn {
  const [isDragging, setIsDragging] = useState(false)
  const [seekPosition, setSeekPosition] = useState<number | null>(null)

  // Refs for DOM and angle tracking
  const progressRef = useRef<SVGSVGElement>(null)
  const previousAngleRef = useRef<number>(0)

  // Store onSeek callback in ref to avoid stale closures in event listeners
  const onSeekRef = useRef(onSeek)
  useEffect(() => {
    onSeekRef.current = onSeek
  }, [onSeek])

  /**
   * Calculate seek time from mouse/touch coordinates using polar coordinates.
   * Handles wraparound prevention at the top of the circle.
   */
  const getSeekTimeFromCoords = useCallback(
    (clientX: number, clientY: number): number | null => {
      if (!progressRef.current || duration === 0) return null

      const rect = progressRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // Calculate angle from center using polar coordinates
      const angle = Math.atan2(clientY - centerY, clientX - centerX)
      // Convert to degrees and normalize to 0-360 (0° at top)
      let degrees = (angle * 180) / Math.PI + 90
      if (degrees < 0) degrees += 360

      const previousDegrees = previousAngleRef.current

      // Prevent wraparound at top of circle by detecting boundary crossings
      const isWrappingForward = previousDegrees > 270 && degrees < 90
      const isWrappingBackward = previousDegrees < 90 && degrees > 270

      if (isWrappingForward) {
        degrees = 360
      } else if (isWrappingBackward) {
        degrees = 0
      } else {
        degrees = Math.max(1, Math.min(359, degrees))
      }

      // Update previous angle for next frame
      previousAngleRef.current = degrees

      // Calculate seek time from angle
      return (degrees / 360) * duration
    },
    [duration]
  )

  // Manage window event listeners for drag
  useEffect(() => {
    if (!isDragging) return

    const handleMove = (clientX: number, clientY: number) => {
      const time = getSeekTimeFromCoords(clientX, clientY)
      if (time !== null) {
        setSeekPosition(Math.max(0, Math.min(duration, time)))
      }
    }

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault()
        handleMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }
    const onUp = () => setIsDragging(false)

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onUp)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [isDragging, duration, getSeekTimeFromCoords])

  // Perform actual seek when drag ends (don't clear seekPosition here)
  useEffect(() => {
    if (!isDragging && seekPosition !== null) {
      onSeekRef.current(seekPosition)
    }
  }, [isDragging, seekPosition])

  // Clear seekPosition once currentTime catches up (within tolerance)
  // This prevents the flash to old position while React state propagates
  useEffect(() => {
    if (seekPosition !== null && Math.abs(currentTime - seekPosition) < 0.5) {
      setSeekPosition(null)
    }
  }, [currentTime, seekPosition])

  // Start drag and initialize previousAngleRef based on current position
  const startDrag = useCallback(() => {
    if (duration > 0) {
      previousAngleRef.current = (currentTime / duration) * 360
    }
    setIsDragging(true)
  }, [currentTime, duration])

  return {
    progressRef,
    displayTime: seekPosition ?? currentTime,
    isDragging,
    startDrag,
  }
}
