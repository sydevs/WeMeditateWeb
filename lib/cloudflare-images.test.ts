import { describe, it, expect } from 'vitest'
import {
  getImageSrcSet,
  getImageURL,
  getVariantName,
  nearestAspectRatio,
} from './cloudflare-images'

const BASE_URL = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123/'
const BASE_URL_NO_SLASH = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123'

// The two shapes a SahajCloud read produces (sydevs/SahajCloud
// `src/plugins/storage/cloudflareImagesAdapter.ts`, `src/plugins/storage/urlFields.ts`).
// The bare fixtures above stay covered: the contract must survive SahajCloud
// emitting one.
const PUBLIC_URL = `${BASE_URL}public`
const FLEXIBLE_URL = `${BASE_URL}format=auto,width=320,height=320,fit=cover`

describe('getImageURL', () => {
  it('resolves a variant on a URL with a trailing slash', () => {
    expect(getImageURL(BASE_URL, 'video-800')).toBe(`${BASE_URL}video-800`)
  })

  it('resolves a variant on a URL without a trailing slash', () => {
    expect(getImageURL(BASE_URL_NO_SLASH, 'video-800')).toBe(`${BASE_URL_NO_SLASH}/video-800`)
  })

  it('replaces the variant on a SahajCloud URL rather than appending one', () => {
    expect(getImageURL(PUBLIC_URL, 'video-800')).toBe(`${BASE_URL}video-800`)
  })

  it('replaces a flexible-variant segment, which carries "=" and ","', () => {
    expect(getImageURL(FLEXIBLE_URL, 'video-800')).toBe(`${BASE_URL}video-800`)
  })

  it('returns the URL unchanged when a path segment follows the variant', () => {
    const deep = `${PUBLIC_URL}/extra`

    expect(getImageURL(deep, 'video-800')).toBe(deep)
  })

  it.each([
    'https://picsum.photos/seed/foo/400/400',
    '/images/local.jpg',
    'https://example.com/cdn-cgi/image/foo.jpg',
  ])('returns the URL unchanged for the non-Cloudflare URL %s', (external) => {
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
    // ultrawide has no small or medium. The fallback is deterministic: smallest defined width.
    expect(getVariantName('ultrawide', 'small')).toBe('ultrawide-1536')
  })
})

describe('getImageSrcSet', () => {
  it.each([
    ['a bare base URL', BASE_URL],
    ['a SahajCloud URL, with the variant replaced', PUBLIC_URL],
    ['a flexible-variant URL', FLEXIBLE_URL],
  ])('returns one entry per width defined for the aspect ratio, from %s', (_label, url) => {
    expect(getImageSrcSet(url, 'video')).toBe(
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

  it('returns empty string when a path segment follows the variant', () => {
    expect(getImageSrcSet(`${PUBLIC_URL}/extra`, 'video')).toBe('')
  })

  it('returns empty string for non-Cloudflare URLs', () => {
    expect(getImageSrcSet('https://picsum.photos/seed/foo/400/400', 'video')).toBe('')
  })
})

describe('nearestAspectRatio', () => {
  it('snaps exact dimensions to their matching ratio', () => {
    expect(nearestAspectRatio(800, 800)).toBe('square')
    expect(nearestAspectRatio(1600, 900)).toBe('video')
    expect(nearestAspectRatio(800, 600)).toBe('4-3')
    expect(nearestAspectRatio(1500, 1000)).toBe('3-2')
    expect(nearestAspectRatio(2100, 900)).toBe('ultrawide')
  })

  it('picks the closest ratio for off-spec dimensions', () => {
    // 1.7 is between 3-2 (1.5) and video (1.78) but closer to video.
    expect(nearestAspectRatio(1700, 1000)).toBe('video')
    // 1.4 is between 4-3 (1.33) and 3-2 (1.5) but closer to 4-3.
    expect(nearestAspectRatio(1400, 1000)).toBe('4-3')
    // Portrait images snap to the squarest available ratio.
    expect(nearestAspectRatio(600, 900)).toBe('square')
  })

  it('falls back to video for missing or invalid dimensions', () => {
    expect(nearestAspectRatio(null, null)).toBe('video')
    expect(nearestAspectRatio(0, 100)).toBe('video')
    expect(nearestAspectRatio(100, 0)).toBe('video')
    expect(nearestAspectRatio(undefined, 100)).toBe('video')
  })
})
