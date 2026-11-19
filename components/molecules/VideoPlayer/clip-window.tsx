'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Slider, useHotkey } from '@videojs/react'
// Spelled `translate` at every call site, never `t`: these keys are the player's own, and `t` is
// how the site's SahajCloud copy reads — `tests/guards/translation-keys.test.ts` matches the name.
import { useTranslator } from '@videojs/react/i18n'
import { usePlayer } from '@videojs/react/video'
import './clip-window.css'
import {
  bufferedPercent,
  formatClock,
  percentSeek,
  secondsToIsoDuration,
  type ClipWindow,
} from './clip'

/**
 * The control-bar row the packaged skin lays its three time controls out in, and the attribute
 * that marks ours apart from them.
 *
 * The class is emitted by `@videojs/react@10.5.0`'s video preset and documented nowhere, so
 * `VideoPlayer.test.tsx` reads the shipped stylesheet and fails when an upgrade drops it.
 * Upstream's own three controls are dropped by `clip-window.css`, so the row keeps its gap, its
 * padding and its container queries with ours in their place.
 */
const TIME_SLIDER_GROUP = '.video-time-slider-group'
const CLIP_CONTROL = { 'data-wm-clip': '' }

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
}

/**
 * The window's elapsed time, in place of the media position the skin would show.
 *
 * A `<time>` carrying an `aria-label` and a `dateTime`, which is what the skin's own
 * `Time.Value` renders — a plain `<div>` has a generic role, and a generic role cannot be named,
 * so the label would be dropped. The class list is upstream's, so this keeps the skin's
 * typography and the container query that hides the position on a narrow player.
 */
export function ClipElapsed({ window }: ClipTimeProps) {
  const translate = useTranslator()
  const { start, length } = useWindowBounds(window)
  const elapsed = useElapsed(start, length)

  return (
    <time
      aria-label={translate('time.current')}
      className="media-time-value video-controls-current-time-value"
      dateTime={secondsToIsoDuration(elapsed)}
      {...CLIP_CONTROL}
    >
      {formatClock(elapsed, length)}
    </time>
  )
}

/** The window's own length, in place of the media duration the skin would show. */
export function ClipDuration({ window }: ClipTimeProps) {
  const translate = useTranslator()
  const { length } = useWindowBounds(window)

  return (
    <time
      aria-label={translate('time.duration')}
      className="media-time-value video-controls-remaining-time-value"
      dateTime={secondsToIsoDuration(length)}
      {...CLIP_CONTROL}
    >
      {formatClock(length, length)}
    </time>
  )
}

/**
 * The percent hotkeys, rescaled to the window.
 *
 * `0`–`9`, `Home` and `End` seek by a share of the *media* in the skin's own hotkeys, so `5` on
 * a clip would land outside the window and the clamp would turn it into a pause. The packaged
 * skin takes no prop that disables three of its twelve bindings, so these win instead: the
 * coordinator dispatches the first match in registration order and stops, and a skin mounts its
 * `children` before its own controls. Mounting this anywhere but inside the skin reverses that.
 * The rest of the skin's hotkeys need no change — a step, a toggle and the volume keys all mean
 * the same thing inside a window.
 */
export function ClipHotkeys({ window }: ClipTimeProps) {
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
 * `min` of 0, `max` of the window length, and a seek that adds the start back. The skin's own
 * slider classes dress it, so it draws as the media slider it replaces.
 *
 * `--media-slider-buffer` is set here because only `TimeSlider` computes one: `SliderCore`
 * tracks fill and pointer, so the generic `Slider` would leave the buffer at 0 and a clip's
 * scrubber would show no buffered range where a full lecture's does.
 */
export function ClipTimeSlider({ window }: ClipTimeProps) {
  const translate = useTranslator()
  const seek = usePlayer((state) => state.seek)
  const buffered = usePlayer((state) => state.buffered)
  const { start, length } = useWindowBounds(window)
  const elapsed = useElapsed(start, length)

  return (
    <Slider.Root
      className="media-slider media-time-slider video-controls-time-slider"
      disabled={length === 0}
      label={{ key: 'slider.seek', text: translate('slider.seek') }}
      max={length}
      min={0}
      style={
        { '--media-slider-buffer': `${bufferedPercent(window, length, buffered)}%` } as CSSProperties
      }
      value={elapsed}
      onValueChange={(value) => void seek(start + value)}
      {...CLIP_CONTROL}
    >
      <Slider.Track className="media-slider-track">
        <Slider.Buffer className="media-slider-buffer" />
        <Slider.Fill className="media-slider-fill" />
      </Slider.Track>
      <Slider.Thumb className="media-slider-thumb" />
    </Slider.Root>
  )
}

/**
 * The window's timeline, drawn in the packaged skin's own control bar.
 *
 * The skin takes no prop that reaches its time controls, so the three replacements are portalled
 * into the row that holds them. That keeps every width the skin computes — its gap, its padding
 * and the container queries that drop the position and the duration on a narrow player — which
 * an overlay positioned beside the bar would have to re-measure.
 *
 * Mount this as a child of the skin, never beside it: the portal carries React context, so the
 * three controls and the hotkeys read the same player as the bar they land in.
 */
export function ClipTimeline({ window }: ClipTimeProps) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const [group, setGroup] = useState<Element | null>(null)

  useEffect(() => {
    const skin = anchorRef.current?.parentElement

    setGroup(skin?.querySelector(TIME_SLIDER_GROUP) ?? null)
  }, [])

  return (
    <>
      <span ref={anchorRef} hidden />
      <ClipHotkeys window={window} />
      {group
        ? createPortal(
            <>
              <ClipElapsed window={window} />
              <ClipTimeSlider window={window} />
              <ClipDuration window={window} />
            </>,
            group,
          )
        : null}
    </>
  )
}
