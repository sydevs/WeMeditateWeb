import { getImageURL, getVariantName } from '../../../lib/cloudflare-images'

/**
 * Resolves a poster to the one variant the player requests.
 *
 * Neither the SSR fallback `<img>` nor Vidstack's poster carries a srcset, so
 * a single width has to cover the player's widest box: a `Container
 * maxWidth="md"`, 896px. It lives here, and not in `VideoPlayer`, because
 * `index.tsx` must not import that browser-only module for a value
 * (components/AGENTS.md).
 */
export function posterURL(poster?: string): string | undefined {
  return poster ? getImageURL(poster, getVariantName('video', 'large')) : poster
}
