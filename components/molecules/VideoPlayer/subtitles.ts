/**
 * The Video collection's inline subtitle cues, in the shape the player's own text-track API takes.
 *
 * The collection stores `{ content, startTimeMs, endTimeMs }`. Video.js 10 adds a track from cue
 * objects, so nothing in between serializes a WebVTT document — which is what used to force a
 * timestamp format, blank-line escaping inside cue text, and a blob URL to serve the result from.
 * This file stays pure, so the mapping is unit-testable away from the player.
 */
import type { TextCueInit } from '@videojs/react'

export interface VideoSubtitleCue {
  content: string
  startTimeMs: number
  endTimeMs: number
}

/** A cue with no text, or no duration, would draw as a blank caption, so it is dropped. */
export function toTextCues(cues: VideoSubtitleCue[]): TextCueInit[] {
  return cues
    .filter(
      (cue) =>
        cue &&
        typeof cue.content === 'string' &&
        cue.content.trim().length > 0 &&
        cue.endTimeMs > cue.startTimeMs,
    )
    .map((cue) => ({
      startTime: cue.startTimeMs / 1000,
      endTime: cue.endTimeMs / 1000,
      text: cue.content.trim(),
    }))
}
