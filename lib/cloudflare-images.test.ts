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
    expect(getImageURL(BASE_URL, 'width=800')).toBe(`${BASE_URL}width=800`)
  })

  it('resolves a variant on a URL without a trailing slash', () => {
    expect(getImageURL(BASE_URL_NO_SLASH, 'width=800')).toBe(`${BASE_URL_NO_SLASH}/width=800`)
  })

  it('replaces the variant on a SahajCloud URL rather than appending one', () => {
    expect(getImageURL(PUBLIC_URL, 'width=800')).toBe(`${BASE_URL}width=800`)
  })

  it('replaces a flexible-variant segment, which carries "=" and ","', () => {
    expect(getImageURL(FLEXIBLE_URL, 'width=800')).toBe(`${BASE_URL}width=800`)
  })

  it('returns the URL unchanged when a path segment follows the variant', () => {
    const deep = `${PUBLIC_URL}/extra`

    expect(getImageURL(deep, 'width=800')).toBe(deep)
  })

  it.each([
    'https://picsum.photos/seed/foo/400/400',
    '/images/local.jpg',
    'https://example.com/cdn-cgi/image/foo.jpg',
  ])('returns the URL unchanged for the non-Cloudflare URL %s', (external) => {
    expect(getImageURL(external, 'width=800')).toBe(external)
  })
})

describe('getVariantName', () => {
  it('returns a flexible "width=" variant for a defined size', () => {
    expect(getVariantName('video', 'medium')).toBe('width=800')
    expect(getVariantName('square', 'xsmall')).toBe('width=200')
    expect(getVariantName('square', 'small')).toBe('width=400')
    expect(getVariantName('4-3', 'large')).toBe('width=1024')
    expect(getVariantName('ultrawide', 'xlarge')).toBe('width=2048')
  })

  it('defaults to medium when size is omitted', () => {
    expect(getVariantName('video')).toBe('width=800')
    expect(getVariantName('square')).toBe('width=800')
  })

  it('falls back to medium when the requested size is not defined for the ratio', () => {
    expect(getVariantName('square', 'large')).toBe('width=800')
    expect(getVariantName('4-3', 'small')).toBe('width=800')
    expect(getVariantName('3-2', 'small')).toBe('width=800')
    // Only square carries xsmall; a thumbnail ladder elsewhere is unchanged.
    expect(getVariantName('video', 'xsmall')).toBe('width=800')
    expect(getVariantName('4-3', 'xsmall')).toBe('width=800')
  })

  it('falls back to the smallest defined width when neither the requested size nor medium exists', () => {
    // ultrawide has no small or medium. The fallback is deterministic: smallest defined width.
    expect(getVariantName('ultrawide', 'small')).toBe('width=1536')
  })

  // Cloudflare answers `400 malformed URL` for a hyphenated variant segment
  // (`video-800`), so every image requesting one breaks with no fallback (#141).
  it.each(['square', 'video', '4-3', '3-2', 'ultrawide'] as const)(
    'never returns a hyphenated named variant for %s',
    (aspectRatio) => {
      for (const size of ['xsmall', 'small', 'medium', 'large', 'xlarge'] as const) {
        expect(getVariantName(aspectRatio, size)).toMatch(/^width=\d+$/)
      }
    },
  )
})

describe('getImageSrcSet', () => {
  it.each([
    ['a bare base URL', BASE_URL],
    ['a SahajCloud URL, with the variant replaced', PUBLIC_URL],
    ['a flexible-variant URL', FLEXIBLE_URL],
  ])('returns one entry per width defined for the aspect ratio, from %s', (_label, url) => {
    expect(getImageSrcSet(url, 'video')).toBe(
      `${BASE_URL}width=640 640w, ${BASE_URL}width=800 800w, ${BASE_URL}width=1024 1024w, ${BASE_URL}width=1536 1536w`,
    )
  })

  it('works with a no-trailing-slash base URL', () => {
    const srcset = getImageSrcSet(BASE_URL_NO_SLASH, 'square')

    expect(srcset).toBe(
      `${BASE_URL_NO_SLASH}/width=200 200w, ${BASE_URL_NO_SLASH}/width=400 400w, ${BASE_URL_NO_SLASH}/width=800 800w, ${BASE_URL_NO_SLASH}/width=1200 1200w`,
    )
  })

  it('leaves every other ratio\'s widths unchanged by the square thumbnail tier', () => {
    expect(getImageSrcSet(BASE_URL, '4-3')).toBe(
      `${BASE_URL}width=800 800w, ${BASE_URL}width=1024 1024w, ${BASE_URL}width=1536 1536w`,
    )
    expect(getImageSrcSet(BASE_URL, '3-2')).toBe(
      `${BASE_URL}width=800 800w, ${BASE_URL}width=1024 1024w, ${BASE_URL}width=1536 1536w`,
    )
  })

  it('handles ultrawide (fewest widths)', () => {
    expect(getImageSrcSet(BASE_URL, 'ultrawide')).toBe(
      `${BASE_URL}width=1536 1536w, ${BASE_URL}width=2048 2048w`,
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
