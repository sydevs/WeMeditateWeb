/**
 * Formats a duration in seconds as `M:SS`.
 *
 * A non-finite input renders as `0:00`: a source of indeterminate length
 * reports `Infinity`, and a media element reports `NaN` until its metadata
 * loads.
 */
// shortcut: an hour or more reads `61:40`, never `1:01:40` — add an hours part
// when a track that long reaches a player.
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  return `${mins}:${secs.toString().padStart(2, '0')}`
}
