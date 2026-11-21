import { describe, it, expect } from 'vitest'
import { toTextCues } from './subtitles'

describe('toTextCues', () => {
  it('maps the collection shape onto the player cue shape, in seconds', () => {
    expect(
      toTextCues([
        { content: 'Hello', startTimeMs: 0, endTimeMs: 2000 },
        { content: 'World', startTimeMs: 2000, endTimeMs: 4250 },
      ]),
    ).toEqual([
      { startTime: 0, endTime: 2, text: 'Hello' },
      { startTime: 2, endTime: 4.25, text: 'World' },
    ])
  })

  it('drops empty cues and cues with non-positive duration', () => {
    expect(
      toTextCues([
        { content: '   ', startTimeMs: 0, endTimeMs: 1000 },
        { content: 'Real', startTimeMs: 1000, endTimeMs: 2000 },
        { content: 'Backwards', startTimeMs: 5000, endTimeMs: 4000 },
      ]),
    ).toEqual([{ startTime: 1, endTime: 2, text: 'Real' }])
  })

  // A blank line inside cue text terminated a serialized WebVTT cue early. A cue object carries
  // its own text, so the line survives rather than being collapsed.
  it('keeps a blank line inside cue text', () => {
    expect(
      toTextCues([{ content: 'line one\n\nline two', startTimeMs: 0, endTimeMs: 1000 }]),
    ).toEqual([{ startTime: 0, endTime: 1, text: 'line one\n\nline two' }])
  })

  it('returns no cues for an empty list', () => {
    expect(toTextCues([])).toEqual([])
  })
})
