import { describe, it, expect } from 'vitest'
import {
  getImageSrcSet,
  getImageURL,
  getVariantName,
  isCloudflareImageURL,
} from './cloudflare-images'

const BASE_URL = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123/'
const BASE_URL_NO_SLASH = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123'

describe('isCloudflareImageURL', () => {
  it('detects imagedelivery.net URLs', () => {
    expect(isCloudflareImageURL(BASE_URL)).toBe(true)
    expect(isCloudflareImageURL(BASE_URL_NO_SLASH)).toBe(true)
  })

  it('rejects non-Cloudflare URLs', () => {
    expect(isCloudflareImageURL('https://picsum.photos/seed/foo/400/400')).toBe(false)
    expect(isCloudflareImageURL('/images/local.jpg')).toBe(false)
    expect(isCloudflareImageURL('https://example.com/cdn-cgi/image/foo.jpg')).toBe(false)
  })
})

describe('getImageURL', () => {
  it('appends variant to a URL with trailing slash', () => {
    expect(getImageURL(BASE_URL, 'video-800')).toBe(`${BASE_URL}video-800`)
  })

  it('appends variant to a URL without trailing slash', () => {
    expect(getImageURL(BASE_URL_NO_SLASH, 'video-800')).toBe(`${BASE_URL_NO_SLASH}/video-800`)
  })

  it('returns the URL unchanged when a variant is already appended', () => {
    const withVariant = `${BASE_URL}public`
    expect(getImageURL(withVariant, 'video-800')).toBe(withVariant)
  })

  it('returns the URL unchanged for non-Cloudflare URLs', () => {
    const external = 'https://picsum.photos/seed/foo/400/400'
    expect(getImageURL(external, 'video-800')).toBe(external)
  })
})

describe('getVariantName', () => {
  it('returns "{aspectRatio}-{width}" for a defined size', () => {
    expect(getVariantName('video', 'medium')).toBe('video-800')
    expect(getVariantName('square', 'small')).toBe('square-400')
    expect(getVariantName('4-3', 'large')).toBe('4-3-1024')
    expect(getVariantName('ultrawide', 'xlarge')).toBe('ultrawide-2048')
  })

  it('defaults to medium when size is omitted', () => {
    expect(getVariantName('video')).toBe('video-800')
    expect(getVariantName('square')).toBe('square-800')
  })

  it('falls back to medium when the requested size is not defined for the ratio', () => {
    expect(getVariantName('square', 'large')).toBe('square-800')
    expect(getVariantName('4-3', 'small')).toBe('4-3-800')
    expect(getVariantName('3-2', 'small')).toBe('3-2-800')
  })

  it('falls back to the smallest defined width when neither the requested size nor medium exists', () => {
    // ultrawide has no small/medium; fallback is deterministic: smallest defined width.
    expect(getVariantName('ultrawide', 'small')).toBe('ultrawide-1536')
  })
})

describe('getImageSrcSet', () => {
  it('returns one entry per width defined for the aspect ratio', () => {
    const srcset = getImageSrcSet(BASE_URL, 'video')
    expect(srcset).toBe(
      `${BASE_URL}video-640 640w, ${BASE_URL}video-800 800w, ${BASE_URL}video-1024 1024w, ${BASE_URL}video-1536 1536w`,
    )
  })

  it('works with a no-trailing-slash base URL', () => {
    const srcset = getImageSrcSet(BASE_URL_NO_SLASH, 'square')
    expect(srcset).toBe(
      `${BASE_URL_NO_SLASH}/square-400 400w, ${BASE_URL_NO_SLASH}/square-800 800w, ${BASE_URL_NO_SLASH}/square-1200 1200w`,
    )
  })

  it('handles ultrawide (fewest widths)', () => {
    expect(getImageSrcSet(BASE_URL, 'ultrawide')).toBe(
      `${BASE_URL}ultrawide-1536 1536w, ${BASE_URL}ultrawide-2048 2048w`,
    )
  })

  it('emits widths sorted ascending', () => {
    const srcset = getImageSrcSet(BASE_URL, 'video')
    const widths = srcset.match(/(\d+)w/g)?.map((w) => parseInt(w, 10))
    expect(widths).toEqual([640, 800, 1024, 1536])
  })

  it('returns empty string when baseUrl already has a variant appended', () => {
    expect(getImageSrcSet(`${BASE_URL}public`, 'video')).toBe('')
  })

  it('returns empty string for non-Cloudflare URLs', () => {
    expect(getImageSrcSet('https://picsum.photos/seed/foo/400/400', 'video')).toBe('')
  })
})
