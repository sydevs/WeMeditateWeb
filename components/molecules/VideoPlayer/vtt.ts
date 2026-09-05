/**
 * WebVTT adapter for the Video collection's inline subtitle cues.
 *
 * The `Video` collection stores subtitles as `{ content, startTimeMs,
 * endTimeMs }` cues. Browsers need a WebVTT track, so this serializes the
 * cues to a VTT string, which VideoPlayer turns into a blob `<track>`. This
 * file stays pure, for unit testing.
 *
 * Ticket 4 (Lectures) adds a second adapter for per-locale .vtt files. Both
 * feed the same VideoPlayer.
 */

export interface VideoSubtitleCue {
  content: string
  startTimeMs: number
  endTimeMs: number
}

const pad = (value: number, length = 2): string => String(value).padStart(length, '0')

/** Format a millisecond offset as a WebVTT timestamp (`HH:MM:SS.mmm`). */
export function msToVttTimestamp(ms: number): string {
  const total = Math.max(0, Math.floor(ms))
  const hours = Math.floor(total / 3_600_000)
  const minutes = Math.floor((total % 3_600_000) / 60_000)
  const seconds = Math.floor((total % 60_000) / 1000)
  const millis = total % 1000

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(millis, 3)}`
}

/** Blank line(s) inside cue text would prematurely terminate the VTT cue. */
const COLLAPSIBLE_BLANK_LINES = /\r?\n\s*\r?\n+/g

/**
 * Serialize inline cues to a WebVTT document. This drops cues with empty
 * content or a non-positive duration. It also collapses cue text, so a
 * blank line inside it cannot prematurely terminate the cue.
 */
export function cuesToVtt(cues: VideoSubtitleCue[]): string {
  const blocks = cues
    .filter(
      (cue) =>
        cue &&
        typeof cue.content === 'string' &&
        cue.content.trim().length > 0 &&
        cue.endTimeMs > cue.startTimeMs,
    )
    .map((cue) => {
      const text = cue.content.replace(COLLAPSIBLE_BLANK_LINES, '\n').trim()

      return `${msToVttTimestamp(cue.startTimeMs)} --> ${msToVttTimestamp(cue.endTimeMs)}\n${text}`
    })

  return blocks.length ? `WEBVTT\n\n${blocks.join('\n\n')}\n` : 'WEBVTT\n'
}
