import { describe, expect, it } from 'vitest'

import { readSeekTimestamp } from './frame-editor'

const CMS = 'https://cloud.sydevelopers.com'

const event = (origin: string, data: unknown) => ({ origin, data })

describe('readSeekTimestamp', () => {
  it('reads the timestamp off a SEEK_TO_TIME message from the CMS', () => {
    expect(readSeekTimestamp(event(CMS, { type: 'SEEK_TO_TIME', timestamp: 42 }), CMS)).toBe(42)
  })

  it('reads 0, which is a real timestamp and not an absent one', () => {
    expect(readSeekTimestamp(event(CMS, { type: 'SEEK_TO_TIME', timestamp: 0 }), CMS)).toBe(0)
  })

  /**
   * ⚠ The regression this file exists for. An earlier version compared the
   * event origin against a `'*'` fallback when `PUBLIC__SAHAJCLOUD_URL` was
   * unset, so a missing environment variable let ANY page drive the playhead
   * that timestamps newly inserted frames.
   */
  it('accepts nothing at all when the CMS origin is unset', () => {
    expect(readSeekTimestamp(event(CMS, { type: 'SEEK_TO_TIME', timestamp: 42 }), undefined)).toBe(
      null,
    )
    expect(
      readSeekTimestamp(event('https://evil.test', { type: 'SEEK_TO_TIME', timestamp: 42 }), ''),
    ).toBe(null)
  })

  it('ignores a message from any other origin', () => {
    expect(
      readSeekTimestamp(event('https://evil.test', { type: 'SEEK_TO_TIME', timestamp: 42 }), CMS),
    ).toBe(null)
  })

  it('ignores anything that is not a seek request', () => {
    for (const data of [
      undefined,
      null,
      'SEEK_TO_TIME',
      {},
      { type: 'payload-live-preview', data: {} },
      { type: 'SEEK_TO_TIME' },
      { type: 'SEEK_TO_TIME', timestamp: '42' },
      { type: 'SEEK_TO_TIME', timestamp: null },
    ]) {
      expect(readSeekTimestamp(event(CMS, data), CMS)).toBe(null)
    }
  })
})
