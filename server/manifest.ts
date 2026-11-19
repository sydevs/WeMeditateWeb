/**
 * The web app manifest, built rather than served from a file.
 *
 * ⚠ **`public/` is shipped by both builds**, the Vike app's and Ladle's, so
 * anything site-wide placed there would also claim to be the Ladle
 * playground's manifest. A route is what keeps it the app's alone — the same
 * reason `/robots.txt` is a route (`server/sitemap-routes.ts`).
 *
 * Its names come from SahajCloud through the translations, so the manifest is
 * in the language of the URL that asked for it.
 */

import { APP_ICON, APP_ICON_SIZE, BACKGROUND_COLOR, THEME_COLOR } from '../lib/app-identity'
import type { TFunction } from '../lib/i18n'
import { localeUrl } from '../lib/urls'
import type { Locale } from './sahajcloud-types'

/** One web app manifest, as the spec names its members. */
export function buildWebManifest(options: {
  origin: string
  locale: Locale
  t: TFunction
}): Record<string, unknown> {
  const { origin, locale, t } = options

  return {
    name: t('common.general.site_title'),
    short_name: t('common.general.site_title'),
    description: t('common.general.site_description'),
    lang: locale,
    start_url: localeUrl(origin, locale, '/'),
    scope: '/',
    // `browser`, not `standalone`: this is a website that a home-screen icon
    // opens, and hiding the browser chrome would strand a visitor with no way
    // back. The native apps are what `standalone` would be pretending to be.
    display: 'browser',
    theme_color: THEME_COLOR,
    background_color: BACKGROUND_COLOR,
    icons: [
      {
        src: APP_ICON,
        sizes: `${APP_ICON_SIZE}x${APP_ICON_SIZE}`,
        type: 'image/png',
        // Both purposes from one asset: the mark's ink sits inside the
        // maskable safe zone, so a platform that crops to its own shape
        // still keeps the whole lotus.
        purpose: 'any maskable',
      },
    ],
  }
}
