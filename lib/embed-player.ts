/**
 * The iframe a consumer embeds, and the geometry everything advertising it
 * agrees on: the paste-ready snippet (`EmbedButton`), `twitter:player` and
 * `og:video` (`lib/content-seo.ts`), and `/oembed` (`server/routes/oembed/oembed.ts`).
 *
 * `lib/document-routes.ts` owns which URL the iframe points at.
 */

/** 16:9 at a size a blog column fits. */
export const PLAYER_WIDTH = 560
export const PLAYER_HEIGHT = 315

/** `autoplay`, or a consumer starting playback on a tap is blocked by the iframe. */
const PLAYER_ALLOW = 'autoplay; fullscreen; encrypted-media; picture-in-picture'

/** The `<iframe>` a consumer pastes, for an absolute player URL. */
export function playerIframe(src: string, width = PLAYER_WIDTH, height = PLAYER_HEIGHT): string {
  return `<iframe src="${src}" width="${width}" height="${height}" frameborder="0" allow="${PLAYER_ALLOW}" allowfullscreen></iframe>`
}
