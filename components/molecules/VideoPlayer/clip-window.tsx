'use client'

import { createContext } from 'react'
import { Slider } from '@videojs/react'
// Spelled `translate` at every call site, never `t`: these keys are the player's own, and `t` is
// how the site's SahajCloud copy reads — `tests/guards/translation-keys.test.ts` matches the name.
import { useTranslator } from '@videojs/react/i18n'
import { usePlayer } from '@videojs/react/video'
import { SliderFill, SliderThumb, SliderTrack } from './skin/ui/slider'
import { cn } from './skin/lib/resolve-class-name'

/**
 * A `[startTime, stopTime]` playback window, in seconds of the underlying media.
 *
 * Video.js 10 has no clipping (videojs/video.js#3040), so a lecture clip's window is this
 * repo's to enforce and to display. The context is what lets the vendored control bar show the
 * window's own timeline without the clip logic reaching into the skin.
 */
export interface ClipWindow {
  /** Where the window opens, in media seconds. */
  start: number
  /** Where it closes, or `null` to run to the end of the media. */
  end: number | null
}

const ClipWindowContext = createContext<ClipWindow | null>(null)

export { ClipWindowContext }

/**
 * Resolve a window from the player's two optional props, or `null` for a video that plays end
 * to end — a full lecture passes `null` for both, and must get no seek and no injected pause.
 *
 * A `stopTime` at or before `startTime` is not a window: that spelling would play nothing. It
 * is dropped, which leaves the start as the only bound, exactly as a bare `startTime` does.
 */
export function resolveClipWindow(
  startTime?: number | null,
  stopTime?: number | null,
): ClipWindow | null {
  const start = typeof startTime === 'number' && startTime > 0 ? startTime : 0
  const end = typeof stopTime === 'number' && stopTime > start ? stopTime : null

  return start === 0 && end === null ? null : { start, end }
}

/**
 * The window in the shape the time UI needs: where it opens, and how long it runs.
 *
 * `length` is 0 until the media reports a duration, which is the same nothing-to-show state the
 * skin's own `Time.Value` marks `data-unavailable`.
 */
function useWindowBounds(window: ClipWindow): { start: number; length: number } {
  const duration = usePlayer((state) => state.duration)
  const end = window.end ?? duration

  return { start: window.start, length: Math.max(end - window.start, 0) }
}

/**
 * Seconds as a clock, in the padding the player's own time displays use: hours unpadded and
 * shown only past the hour, minutes padded beside hours, seconds always padded.
 *
 * shortcut: Latin digits whatever the locale, where `Time.Value` asks `Intl` for the locale's
 * own. Upgrade it when the site launches a locale that writes numbers in another script.
 */
function formatClock(seconds: number, guide: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds2 = String(total % 60).padStart(2, '0')

  return hours > 0 || guide >= 3600
    ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds2}`
    : `${minutes}:${seconds2}`
}

/** Where playback sits inside the window, clamped to it. */
function useElapsed(start: number, length: number): number {
  const currentTime = usePlayer((state) => state.currentTime)

  return Math.min(Math.max(currentTime - start, 0), length)
}

export interface ClipTimeProps {
  window: ClipWindow
  className?: string
}

/** The window's elapsed time, in place of the media position the skin would show. */
export function ClipElapsed({ window, className }: ClipTimeProps) {
  const translate = useTranslator()
  const { start, length } = useWindowBounds(window)
  const elapsed = useElapsed(start, length)

  return (
    <div aria-label={translate('time.current')} className={className} role="timer">
      {formatClock(elapsed, length)}
    </div>
  )
}

/** The window's own length, in place of the media duration the skin would show. */
export function ClipDuration({ window, className }: ClipTimeProps) {
  const translate = useTranslator()
  const { length } = useWindowBounds(window)

  return (
    <div aria-label={translate('time.duration')} className={className}>
      {formatClock(length, length)}
    </div>
  )
}

/**
 * A time slider over the window rather than the media.
 *
 * `TimeSlider` takes its scale from the player store's `currentTime` and `duration`, with no
 * prop that shifts either, so a window needs the generic `Slider` and an offset of our own:
 * `min` of 0, `max` of the window length, and a seek that adds the start back.
 */
export function ClipTimeSlider({ window, className }: ClipTimeProps) {
  const translate = useTranslator()
  const seek = usePlayer((state) => state.seek)
  const { start, length } = useWindowBounds(window)
  const elapsed = useElapsed(start, length)

  return (
    <Slider.Root
      className={cn(
        'group/slider relative flex flex-1 cursor-pointer items-center justify-center outline-hidden',
        'h-(--media-slider-height,--spacing(8)) min-w-18 rounded-media-pill',
        'transition-[--media-slider-fill] duration-media-slider ease-out data-dragging:duration-0',
        className,
      )}
      disabled={length === 0}
      label={{ key: 'slider.seek', text: translate('slider.seek') }}
      max={length}
      min={0}
      value={elapsed}
      onValueChange={(value) => void seek(start + value)}
    >
      <SliderTrack className="min-h-0 min-w-0 flex-1">
        <SliderFill />
      </SliderTrack>
      <SliderThumb />
    </Slider.Root>
  )
}
