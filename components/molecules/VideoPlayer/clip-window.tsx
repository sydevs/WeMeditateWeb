'use client'

import { createContext } from 'react'
import { Slider, useHotkey } from '@videojs/react'
// Spelled `translate` at every call site, never `t`: these keys are the player's own, and `t` is
// how the site's SahajCloud copy reads — `tests/guards/translation-keys.test.ts` matches the name.
import { useTranslator } from '@videojs/react/i18n'
import { usePlayer } from '@videojs/react/video'
import { SliderFill, SliderThumb, SliderTrack } from './skin/ui/slider'
import { cn } from './skin/lib/resolve-class-name'
import { formatClock, percentSeek, secondsToIsoDuration, type ClipWindow } from './clip'

/**
 * The ambient playback window, `null` for a video that plays end to end. It is what lets the
 * vendored control bar draw the window's own timeline without the clip logic reaching into the
 * skin — see skin/README.md.
 */
export const ClipWindowContext = createContext<ClipWindow | null>(null)

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

/** Where playback sits inside the window, clamped to it. */
function useElapsed(start: number, length: number): number {
  const currentTime = usePlayer((state) => state.currentTime)

  return Math.min(Math.max(currentTime - start, 0), length)
}

export interface ClipTimeProps {
  window: ClipWindow
  className?: string
}

/**
 * The window's elapsed time, in place of the media position the skin would show.
 *
 * A `<time>` carrying an `aria-label` and a `dateTime`, which is what the skin's own
 * `Time.Value` renders — a plain `<div>` has a generic role, and a generic role cannot be named,
 * so the label would be dropped.
 */
export function ClipElapsed({ window, className }: ClipTimeProps) {
  const translate = useTranslator()
  const { start, length } = useWindowBounds(window)
  const elapsed = useElapsed(start, length)

  return (
    <time aria-label={translate('time.current')} className={className} dateTime={secondsToIsoDuration(elapsed)}>
      {formatClock(elapsed, length)}
    </time>
  )
}

/** The window's own length, in place of the media duration the skin would show. */
export function ClipDuration({ window, className }: ClipTimeProps) {
  const translate = useTranslator()
  const { length } = useWindowBounds(window)

  return (
    <time aria-label={translate('time.duration')} className={className} dateTime={secondsToIsoDuration(length)}>
      {formatClock(length, length)}
    </time>
  )
}

/**
 * The percent hotkeys, rescaled to the window.
 *
 * `0`–`9`, `Home` and `End` seek by a share of the *media* in the skin's own hotkeys, so `5` on
 * a clip would land outside the window and the clamp would turn it into a pause. The skin leaves
 * these three to us whenever a window is mounted, and the rest of its hotkeys need no change: a
 * step, a toggle and the volume keys all mean the same thing inside a window.
 */
export function ClipHotkeys({ window }: { window: ClipWindow }) {
  const seek = usePlayer((state) => state.seek)
  const { start, length } = useWindowBounds(window)

  useHotkey({
    keys: '0-9',
    onActivate: (_event, key) => {
      const to = percentSeek(start, length, key)

      if (to !== null) {
        void seek(to)
      }
    },
  })
  useHotkey({ keys: 'Home', onActivate: () => void seek(start) })
  useHotkey({ keys: 'End', onActivate: () => void seek(start + length) })

  return null
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
