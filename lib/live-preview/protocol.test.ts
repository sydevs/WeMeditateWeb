import { describe, expect, it } from 'vitest'

import { LIVE_PREVIEW_INACTIVE, LIVE_PREVIEW_PARAM, readLivePreviewScope } from './protocol'

describe('readLivePreviewScope', () => {
  it('accepts the two scopes the CMS emits', () => {
    expect(readLivePreviewScope('wm-web-translations')).toBe('wm-web-translations')
    expect(readLivePreviewScope('wm-web-config')).toBe('wm-web-config')
  })

  it('falls back to the default rather than widening', () => {
    // An unrecognised scope must never mean "everything reads drafts".
    expect(readLivePreviewScope('everything')).toBeNull()
    expect(readLivePreviewScope('all')).toBeNull()
    expect(readLivePreviewScope(undefined)).toBeNull()
  })
})

describe('the shared vocabulary', () => {
  it('spells the parameter the way SahajCloud and SahajAtlasWeb do', () => {
    // Both halves import this one constant. It was spelled twice before, in
    // the server module and in the browser-side scrub, with a comment asking
    // the two to stay in step.
    expect(LIVE_PREVIEW_PARAM).toBe('live-preview')
  })

  it('has an inactive verdict that unlocks nothing', () => {
    expect(LIVE_PREVIEW_INACTIVE).toEqual({ active: false, scope: null })
  })
})
