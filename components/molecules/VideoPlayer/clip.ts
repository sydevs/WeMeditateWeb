/**
 * A lecture clip's playback window, and how its clock reads.
 *
 * Video.js 10 has no clipping (videojs/video.js#3040), so the window is this repo's to resolve,
 * to enforce and to display. This file stays pure so each decision is unit-testable on its own,
 * away from the player that applies it.
 */

/** A `[start, end]` playback window, in seconds of the underlying media. */
export interface ClipWindow {
  /** Where the window opens. */
  start: number
  /** Where it closes, or `null` to run to the end of the media. */
  end: number | null
}

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
 * Seconds as a clock, in the padding the player's own time displays use: hours unpadded and
 * shown only past the hour, minutes padded beside hours, seconds always padded. `guide` is the
 * duration the display belongs to, so a 0:30 position inside a 2-hour window still reads
 * `0:00:30` and the row does not reflow as the hour digit arrives.
 *
 * shortcut: Latin digits whatever the locale, where the player's own `Time.Value` asks `Intl`
 * for the locale's own. Upgrade it when the site launches a locale that writes numbers in
 * another script.
 */
export function formatClock(seconds: number, guide = 0): string {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const padded = String(total % 60).padStart(2, '0')

  return hours > 0 || guide >= 3600
    ? `${hours}:${String(minutes).padStart(2, '0')}:${padded}`
    : `${minutes}:${padded}`
}

/** How close to the window's end still counts as the end, given `timeupdate`'s ~250ms. */
const END_TOLERANCE = 0.5

/** What the player owes the window at `currentTime`, or `null` when playback is inside it. */
export type ClipCorrection = { kind: 'seek'; time: number } | { kind: 'pause' } | null

/**
 * Keep playback inside the window.
 *
 * Checked on every `timeupdate` rather than seeking once on load, because that is the one place
 * every way out of the window converges: a drag, a hotkey, a double-tap gesture, or a resumed
 * position the browser restored.
 */
export function holdInWindow(window: ClipWindow | null, currentTime: number): ClipCorrection {
  if (!window) {
    return null
  }

  if (currentTime < window.start) {
    return { kind: 'seek', time: window.start }
  }

  return window.end !== null && currentTime >= window.end ? { kind: 'pause' } : null
}

/**
 * Where play should resume from, or `null` to carry on where it is.
 *
 * A window that has run out would otherwise pause again on the next `timeupdate`, leaving the
 * play button inert.
 */
export function replayFrom(window: ClipWindow | null, currentTime: number): number | null {
  if (window?.end == null) {
    return null
  }

  return currentTime >= window.end - END_TOLERANCE ? window.start : null
}

/**
 * Seconds as an ISO 8601 duration, for a `<time>` element's `dateTime`. The player's own
 * `Time.Value` renders a `<time>` carrying one, so the window's displays match it.
 */
export function secondsToIsoDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)

  return `PT${hours > 0 ? `${hours}H` : ''}${minutes > 0 ? `${minutes}M` : ''}${total % 60}S`
}

/**
 * How much of the window has buffered, as a 0–100 percentage.
 *
 * The media's buffered ranges are absolute, so only the last one's end matters — which is what
 * the skin's own `TimeSlider` reads — and inside a window that end is measured from the start
 * and capped at the length. A `length` of 0 is the duration-unknown state, where there is
 * nothing to show.
 */
export function bufferedPercent(
  window: ClipWindow,
  length: number,
  buffered: readonly (readonly [number, number])[],
): number {
  if (length <= 0 || buffered.length === 0) {
    return 0
  }

  const end = buffered[buffered.length - 1][1]

  return (Math.min(Math.max(end - window.start, 0), length) / length) * 100
}

/**
 * Where a `0`–`9`, `Home` or `End` keypress should seek to inside the window, or `null` for a
 * key that is none of those.
 *
 * The skin's own percent hotkeys seek by a share of the media, so a window rescales them: `5`
 * means halfway through the window.
 */
export function percentSeek(start: number, length: number, key: string): number | null {
  const percent = key === 'Home' ? 0 : key === 'End' ? 100 : Number.parseInt(key, 10) * 10

  return Number.isNaN(percent) ? null : start + (length * percent) / 100
}
