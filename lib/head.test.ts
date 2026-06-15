import { describe, it, expect } from 'vitest'
import { resolveOgImageUrl } from './head'

const CF_URL = 'https://imagedelivery.net/acct/abc123/'

describe('resolveOgImageUrl', () => {
  it('appends a large video variant to a Cloudflare image URL', () => {
    expect(resolveOgImageUrl({ url: CF_URL })).toBe(`${CF_URL}video-1024`)
  })

  it('returns a non-Cloudflare URL unchanged', () => {
    const external = 'https://example.com/preview.jpg'

    expect(resolveOgImageUrl({ url: external })).toBe(external)
  })

  it('returns null for a bare id (unpopulated relationship)', () => {
    expect(resolveOgImageUrl(7)).toBeNull()
  })

  it('returns null when the image or its url is missing', () => {
    expect(resolveOgImageUrl(null)).toBeNull()
    expect(resolveOgImageUrl(undefined)).toBeNull()
    expect(resolveOgImageUrl({})).toBeNull()
    expect(resolveOgImageUrl({ url: null })).toBeNull()
  })
})
