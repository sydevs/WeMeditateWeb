import { describe, it, expect } from 'vitest'
import { cuesToVtt, msToVttTimestamp } from './vtt'

describe('msToVttTimestamp', () => {
  it('formats millisecond offsets as HH:MM:SS.mmm', () => {
    expect(msToVttTimestamp(0)).toBe('00:00:00.000')
    expect(msToVttTimestamp(1500)).toBe('00:00:01.500')
    expect(msToVttTimestamp(61_000)).toBe('00:01:01.000')
    expect(msToVttTimestamp(3_661_250)).toBe('01:01:01.250')
  })

  it('clamps negatives to zero and floors fractional ms', () => {
    expect(msToVttTimestamp(-500)).toBe('00:00:00.000')
    expect(msToVttTimestamp(1234.9)).toBe('00:00:01.234')
  })
})

describe('cuesToVtt', () => {
  it('serializes cues into a WebVTT document', () => {
    const vtt = cuesToVtt([
      { content: 'Hello', startTimeMs: 0, endTimeMs: 2000 },
      { content: 'World', startTimeMs: 2000, endTimeMs: 4000 },
    ])

    expect(vtt).toBe(
      'WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nHello\n\n00:00:02.000 --> 00:00:04.000\nWorld\n',
    )
  })

  it('drops empty cues and cues with non-positive duration', () => {
    const vtt = cuesToVtt([
      { content: '   ', startTimeMs: 0, endTimeMs: 1000 },
      { content: 'Real', startTimeMs: 1000, endTimeMs: 2000 },
      { content: 'Backwards', startTimeMs: 5000, endTimeMs: 4000 },
    ])

    expect(vtt).toBe('WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nReal\n')
  })

  it('collapses blank lines inside cue text so the cue is not terminated early', () => {
    const vtt = cuesToVtt([{ content: 'line one\n\n\nline two', startTimeMs: 0, endTimeMs: 1000 }])

    expect(vtt).toContain('line one\nline two')
  })

  it('returns a bare WEBVTT header when there are no usable cues', () => {
    expect(cuesToVtt([])).toBe('WEBVTT\n')
  })
})
