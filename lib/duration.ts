/**
 * Formats a duration in seconds as `M:SS`, the media-player convention —
 * shared by `AudioPlayer`, `Playlist` and `MeditationPlayer` so a timestamp
 * reads the same wherever it appears.
 *
 * A non-finite input renders as `0:00`: howler reports `Infinity` for a
 * stream of indeterminate length, which the arithmetic below would otherwise
 * render as `Infinity:NaN`.
 */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  return `${mins}:${secs.toString().padStart(2, '0')}`
}
