/**
 * Cloudflare Images utilities.
 *
 * Every image URL SahajCloud returns already carries a variant segment:
 * `https://imagedelivery.net/<account>/<image_id>/public`, because
 * `getCloudflareImagesUrl` defaults the variant to `public` (sydevs/SahajCloud
 * `src/plugins/storage/cloudflareImagesAdapter.ts`). Swapping that segment for
 * a named variant (for example, `square-400`, `video-800`, `4-3-1024`) yields
 * an optimized, format-negotiated image (AVIF, WebP, or JPEG) delivered
 * through Cloudflare's CDN.
 *
 * Variants must be configured in the Cloudflare dashboard, to match the
 * `{aspectRatio}-{width}` names derived from SIZE_WIDTH_MAP below.
 */

const CLOUDFLARE_IMAGE_URL_PREFIX = 'https://imagedelivery.net/'

// Splits a Cloudflare Images URL into its `<prefix><account>/<image_id>` base
// and the optional variant segment that follows. The segment is matched
// loosely because a flexible variant carries `=` and `,`
// (`format=auto,width=320`). A deeper path is not a shape Cloudflare serves,
// so it falls through untransformed.
const CLOUDFLARE_URL_PATTERN = /^(https:\/\/imagedelivery\.net\/[^/]+\/[^/]+)(?:\/[^/]*)?$/

/** The variant-less base of a Cloudflare Images URL, or null for any other URL. */
function imageBaseURL(url: string): string | null {
  return CLOUDFLARE_URL_PATTERN.exec(url)?.[1] ?? null
}

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
 * Resolves a Cloudflare Images URL to one variant.
 *
 * A variant segment already present is **replaced**, not appended:
 * `…/<image_id>/public/<variant>` does not resolve. Any other URL comes back
 * unchanged, which covers the `/api/<collection>/file/<filename>` fallback a
 * SahajCloud dev server returns.
 */
export function getImageURL(baseUrl: string, variant: string): string {
  const base = imageBaseURL(baseUrl)

  return base ? `${base}/${variant}` : baseUrl
}

export function getVariantName(aspectRatio: AspectRatio, size: ImageSize = 'medium'): string {
  const widths = SIZE_WIDTH_MAP[aspectRatio] as Partial<Record<ImageSize, number>>
  // Prefer an exact match, then medium, then the smallest defined width for
  // this ratio, so the name stays deterministic regardless of object-key
  // insertion order. The dashboard must carry every name SIZE_WIDTH_MAP can
  // produce; nothing here verifies that (#141).
  const width = widths[size] ?? widths.medium ?? Math.min(...(Object.values(widths) as number[]))

  return `${aspectRatio}-${width}`
}

export function getImageSrcSet(baseUrl: string, aspectRatio: AspectRatio): string {
  const base = imageBaseURL(baseUrl)

  if (!base) {
    return ''
  }
  const widths = (Object.values(SIZE_WIDTH_MAP[aspectRatio]) as number[])
    .slice()
    .sort((a, b) => a - b)

  return widths.map((width) => `${base}/${aspectRatio}-${width} ${width}w`).join(', ')
}

/** Numeric width/height ratio for each supported aspect ratio. */
const ASPECT_RATIO_VALUES: Record<AspectRatio, number> = {
  square: 1,
  '4-3': 4 / 3,
  '3-2': 3 / 2,
  video: 16 / 9,
  ultrawide: 21 / 9,
}

/** Precomputed entries, so nearestAspectRatio does not rebuild them per call. */
const ASPECT_RATIO_ENTRIES = Object.entries(ASPECT_RATIO_VALUES) as [AspectRatio, number][]

/**
 * Picks the supported AspectRatio closest to an image's intrinsic dimensions.
 *
 * A Cloudflare Images URL only resolves once a variant is appended, and
 * the variant name encodes a fixed aspect ratio. For a content image of
 * arbitrary dimensions (for example, an inline article upload), the
 * ratio is not known ahead of time. This function snaps to the nearest
 * configured variant, to minimize cropping.
 *
 * Falls back to `video` (a safe landscape default) when the dimensions
 * are missing or invalid.
 */
export function nearestAspectRatio(
  width: number | null | undefined,
  height: number | null | undefined,
): AspectRatio {
  if (!width || !height || width <= 0 || height <= 0) {
    return 'video'
  }
  const target = width / height
  let best: AspectRatio = 'video'
  let bestDelta = Infinity

  for (const [ratio, value] of ASPECT_RATIO_ENTRIES) {
    const delta = Math.abs(value - target)

    if (delta < bestDelta) {
      bestDelta = delta
      best = ratio
    }
  }

  return best
}
