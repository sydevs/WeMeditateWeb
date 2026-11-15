import { getImageSrcSet, getImageURL, getVariantName } from '../../../lib/cloudflare-images'

/**
 * Vidstack's `poster` takes one URL and no srcset, so this width covers the
 * player's widest in-app box on its own: `max-w-4xl`, 896px.
 */
const POSTER_VARIANT = getVariantName('video', 'large')

/**
 * The poster's box wherever a layout bounds it: `max-w-4xl` in
 * `LectureTemplate`, and 32px narrower inside `PageTemplate`'s `Container`,
 * which picks the same rung off the video ladder. A route that renders the
 * player unbounded passes its own — `/lectures/:id/embed` sets no Layout, so
 * the iframe's width is the box.
 */
export const BOUNDED_POSTER_SIZES = '(min-width: 896px) 896px, 100vw'

/**
 * Resolves a poster to the one variant the mounted player requests.
 *
 * It lives here, and not in `VideoPlayer`, because `index.tsx` must not import
 * that browser-only module for a value (components/AGENTS.md).
 */
export function posterURL(poster?: string): string | undefined {
  return poster ? getImageURL(poster, POSTER_VARIANT) : poster
}

/** The full video ladder for the SSR fallback, or undefined for a URL it cannot resize. */
export function posterSrcSet(poster?: string): string | undefined {
  return poster ? getImageSrcSet(poster, 'video') || undefined : undefined
}
