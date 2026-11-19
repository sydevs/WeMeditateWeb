/**
 * How this site identifies itself to a device: the native apps behind it, and
 * the colours and icons a browser chrome or a home screen uses.
 *
 * Separate from `lib/site-identity.ts`, which is who the site is on the web —
 * the profiles the footer links and `Organization` claims. These are the
 * platform's own identifiers, which is why neither is a translation.
 */

/** The We Meditate app on each store, by the id that store keys on. */
export const APP_STORE_ID = '6465684494'
export const PLAY_STORE_ID = 'co.wemeditate.sahajaapp'

export const APP_STORE_URL = `https://apps.apple.com/us/app/we-meditate/id${APP_STORE_ID}`
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}`

/**
 * The browser-chrome colour, matching `--surface-primary` in
 * `layouts/tailwind.css`.
 *
 * ⚠ **A literal, because a meta tag cannot read a CSS custom property.** The
 * stylesheet is the design's own source; this is the one place that value is
 * restated, and `lib/app-identity.test.ts` reads the stylesheet to keep the
 * two equal.
 */
export const THEME_COLOR = '#427b73'

/** The home-screen and splash background, which the manifest also names. */
export const BACKGROUND_COLOR = '#ffffff'

/**
 * The square render the platforms want: a home-screen icon, an
 * apple-touch-icon, and the manifest's own icon.
 *
 * The lotus mark alone, not the lockup the share card carries: a home screen
 * draws this at 48–180px, where a wordmark is a grey smudge. Its ink spans
 * 70% of the canvas, which is inside the maskable safe zone, so one asset
 * answers both `purpose` values. A platform downscales it and none upscales,
 * so one size answers every slot.
 */
export const APP_ICON = '/images/metadata/icon.png'
export const APP_ICON_SIZE = 1024
