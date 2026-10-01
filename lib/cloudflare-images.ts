/**
 * Cloudflare Images utilities.
 *
 * A SahajCloud URL already carries a variant segment (`…/<image_id>/public`), so
 * a named variant replaces that segment rather than being appended
 * (sydevs/SahajCloud `src/plugins/storage/cloudflareImagesAdapter.ts`). The
 * result is an optimized, format-negotiated image from Cloudflare's CDN.
 *
 * Variants must be configured in the Cloudflare dashboard, to match the
 * `{aspectRatio}-{width}` names derived from SIZE_WIDTH_MAP below.
 */

// The variant segment is matched loosely, because a flexible variant carries `=`
// and `,` (`format=auto,width=320`). Cloudflare permits a `/` inside a custom
// image id, but SahajCloud slugifies every id (sydevs/SahajCloud
// `src/plugins/storage/filenameUtils.ts`), so anchoring the base to two segments
// is safe here.
const CLOUDFLARE_URL_PATTERN = /^(https:\/\/imagedelivery\.net\/[^/]+\/[^/]+)(?:\/[^/]*)?$/

/** The variant-less base of a Cloudflare Images URL, or null for any other URL. */
function imageBaseURL(url: string): string | null {
  return CLOUDFLARE_URL_PATTERN.exec(url)?.[1] ?? null
}

// TODO: nothing verifies that the Cloudflare dashboard carries every name this
// map can produce, and a missing variant 404s the image (#141).
const SIZE_WIDTH_MAP = {
  square: { small: 400, medium: 800, xlarge: 1200 },
  video: { small: 640, medium: 800, large: 1024, xlarge: 1536 },
  '4-3': { medium: 800, large: 1024, xlarge: 1536 },
  '3-2': { medium: 800, large: 1024, xlarge: 1536 },
  ultrawide: { large: 1536, xlarge: 2048 },
} as const

export type AspectRatio = keyof typeof SIZE_WIDTH_MAP
export type ImageSize = 'small' | 'medium' | 'large' | 'xlarge'

/** Ascending `<variant> <width>w` srcset entries, less the base URL each needs. */
const SRCSET_SUFFIXES = {} as Record<AspectRatio, readonly string[]>

for (const [aspectRatio, widths] of Object.entries(SIZE_WIDTH_MAP) as [
  AspectRatio,
  Partial<Record<ImageSize, number>>,
][]) {
  SRCSET_SUFFIXES[aspectRatio] = (Object.entries(widths) as [ImageSize, number][])
    .sort(([, a], [, b]) => a - b)
    .map(([size, width]) => `${getVariantName(aspectRatio, size)} ${width}w`)
}

/** True when this module can resolve `url` to a variant. */
export function isCloudflareImageURL(url: string): boolean {
  return imageBaseURL(url) !== null
}

/**
 * Resolves a Cloudflare Images URL to one variant, replacing any variant segment
 * already present — `…/<image_id>/public/<variant>` does not resolve. Any other
 * URL comes back unchanged, including the `/api/<collection>/file/<filename>`
 * fallback a SahajCloud dev server returns.
 */
export function getImageURL(baseUrl: string, variant: string): string {
  const base = imageBaseURL(baseUrl)

  return base ? `${base}/${variant}` : baseUrl
}

export function getVariantName(aspectRatio: AspectRatio, size: ImageSize = 'medium'): string {
  const widths = SIZE_WIDTH_MAP[aspectRatio] as Partial<Record<ImageSize, number>>
  // Prefer an exact match, then medium, then the smallest defined width for this
  // ratio, so the name stays deterministic regardless of object-key insertion
  // order.
  const width = widths[size] ?? widths.medium ?? Math.min(...(Object.values(widths) as number[]))

  return `${aspectRatio}-${width}`
}

export function getImageSrcSet(baseUrl: string, aspectRatio: AspectRatio): string {
  const base = imageBaseURL(baseUrl)

  if (!base) {
    return ''
  }

  return SRCSET_SUFFIXES[aspectRatio].map((suffix) => `${base}/${suffix}`).join(', ')
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
