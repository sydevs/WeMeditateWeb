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

  it('falls back to the largest available width when neither the requested size nor medium is defined', () => {
    // ultrawide has no small/medium, so request "small" should fall through to a defined width
    const variant = getVariantName('ultrawide', 'small')
    expect(['ultrawide-1536', 'ultrawide-2048']).toContain(variant)
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
})
