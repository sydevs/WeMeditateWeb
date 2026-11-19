/**
 * The iframe a consumer embeds, and the geometry everything that advertises
 * it has to agree on.
 *
 * Three surfaces name the same player: the paste-ready snippet
 * (`EmbedButton`), the `twitter:player` and `og:video` tags on the content
 * route (`lib/content-seo.ts`), and the oEmbed endpoint
 * (`server/oembed/`). A width that differed between them would
 * letterbox the player in one consumer and crop it in another.
 *
 * `lib/document-routes.ts` owns which URL the iframe points at.
 */

/** 16:9 at a size a blog column fits, which is what every consumer assumes. */
export const PLAYER_WIDTH = 560
export const PLAYER_HEIGHT = 315

/**
 * What the player needs from the embedding document.
 *
 * `autoplay` is here because a consumer that starts playback on a tap would
 * otherwise be blocked by the iframe, not by the browser's own gesture rule.
 */
export const PLAYER_ALLOW = 'autoplay; fullscreen; encrypted-media; picture-in-picture'

/** The `<iframe>` a consumer pastes, for an absolute player URL. */
export function playerIframe(src: string): string {
  return `<iframe src="${src}" width="${PLAYER_WIDTH}" height="${PLAYER_HEIGHT}" frameborder="0" allow="${PLAYER_ALLOW}" allowfullscreen></iframe>`
}
