import { describe, expect, it } from 'vitest'
import { shouldBlockPreviewLink } from './previewNavigation'

describe('shouldBlockPreviewLink', () => {
  it('blocks internal route links so the iframe stays on the previewed document', () => {
    expect(shouldBlockPreviewLink('/about')).toBe(true)
    expect(shouldBlockPreviewLink('/es/meditations')).toBe(true)
    expect(shouldBlockPreviewLink('/')).toBe(true)
  })

  it('blocks external and other-protocol links', () => {
    expect(shouldBlockPreviewLink('https://wemeditate.com')).toBe(true)
    expect(shouldBlockPreviewLink('http://example.com')).toBe(true)
    expect(shouldBlockPreviewLink('mailto:hello@example.com')).toBe(true)
    expect(shouldBlockPreviewLink('tel:+1234567890')).toBe(true)
  })

  it('allows same-page hash links so table-of-contents jumps still scroll', () => {
    expect(shouldBlockPreviewLink('#section-1')).toBe(false)
    expect(shouldBlockPreviewLink('#')).toBe(false)
  })

  it('ignores anchors without a navigable href', () => {
    expect(shouldBlockPreviewLink(null)).toBe(false)
    expect(shouldBlockPreviewLink(undefined)).toBe(false)
    expect(shouldBlockPreviewLink('')).toBe(false)
  })
})
