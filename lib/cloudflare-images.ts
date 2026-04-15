/**
 * Cloudflare Images utilities.
 *
 * SahajCloud returns base URLs like
 * `https://imagedelivery.net/<account>/<image_id>/`. Appending a variant name
 * (e.g. `square-400`, `video-800`, `4-3-1024`) yields an optimized, format-
 * negotiated image (AVIF / WebP / JPEG) delivered through Cloudflare's CDN.
 *
 * Variants must be configured in the Cloudflare dashboard to match the
 * `{aspectRatio}-{width}` names derived from SIZE_WIDTH_MAP below.
 */

const CLOUDFLARE_IMAGE_URL_PREFIX = 'https://imagedelivery.net/'

// Matches a bare Cloudflare Images base URL: <prefix><account>/<image_id>/?
// Anything after <image_id>/ (e.g. an already-appended variant like `/public`)
// will fail this check and skip transformation to avoid producing invalid
// `…/<existing-variant>/<new-variant>` URLs.
const BARE_CLOUDFLARE_URL_PATTERN =
  /^https:\/\/imagedelivery\.net\/[^/]+\/[^/]+\/?$/

const SIZE_WIDTH_MAP = {
  square: { small: 400, medium: 800, xlarge: 1200 },
  video: { small: 640, medium: 800, large: 1024, xlarge: 1536 },
  '4-3': { medium: 800, large: 1024, xlarge: 1536 },
  '3-2': { medium: 800, large: 1024, xlarge: 1536 },
  ultrawide: { large: 1536, xlarge: 2048 },
} as const

export type AspectRatio = keyof typeof SIZE_WIDTH_MAP
export type ImageSize = 'small' | 'medium' | 'large' | 'xlarge'

export function isCloudflareImageURL(url: string): boolean {
  return url.startsWith(CLOUDFLARE_IMAGE_URL_PREFIX)
}

/**
 * Appends a variant to a Cloudflare Images base URL.
 *
 * Expects `baseUrl` to be bare (`…/<account>/<image_id>/?`). If it already
 * has a variant segment appended, returns it unchanged.
 */
export function getImageURL(baseUrl: string, variant: string): string {
  if (!BARE_CLOUDFLARE_URL_PATTERN.test(baseUrl)) {
    return baseUrl
  }
  const url = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return `${url}${variant}`
}

export function getVariantName(aspectRatio: AspectRatio, size: ImageSize = 'medium'): string {
  const widths = SIZE_WIDTH_MAP[aspectRatio] as Partial<Record<ImageSize, number>>
  // Prefer exact match, then medium, then the smallest defined width for this
  // ratio — guarantees the returned variant exists in the Cloudflare dashboard
  // and is deterministic regardless of object-key insertion order.
  const width =
    widths[size] ?? widths.medium ?? Math.min(...(Object.values(widths) as number[]))
  return `${aspectRatio}-${width}`
}

export function getImageSrcSet(baseUrl: string, aspectRatio: AspectRatio): string {
  if (!BARE_CLOUDFLARE_URL_PATTERN.test(baseUrl)) {
    return ''
  }
  const widths = (Object.values(SIZE_WIDTH_MAP[aspectRatio]) as number[])
    .slice()
    .sort((a, b) => a - b)
  return widths
    .map((width) => `${getImageURL(baseUrl, `${aspectRatio}-${width}`)} ${width}w`)
    .join(', ')
}
