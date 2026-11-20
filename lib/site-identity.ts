/**
 * Who this site is: the profiles it keeps elsewhere on the web, and how it
 * identifies itself to a device. None of these is a translation.
 *
 * The footer links the profiles and `Organization` claims them as `sameAs`:
 * a profile the markup omits is one search engines never associate with us.
 *
 * TODO: Configure the profiles from SahajCloud settings when the fields exist.
 */

import type { SocialLink } from '../components/organisms/Footer'

export const SOCIAL_PROFILES: readonly SocialLink[] = [
  { platform: 'facebook', href: 'https://facebook.com/wemeditate' },
  { platform: 'instagram', href: 'https://instagram.com/wemeditate' },
  { platform: 'youtube', href: 'https://youtube.com/wemeditate' },
]

/** The `twitter:site` account. */
export const TWITTER_HANDLE = '@wemeditate'

/** The We Meditate app on the App Store, which `apple-itunes-app` offers. */
export const APP_STORE_ID = '6465684494'

/**
 * The browser-chrome colour.
 *
 * ⚠ Restates `--color-teal-600` in `layouts/tailwind.css`, because a meta tag
 * cannot read a CSS custom property. `site-identity.test.ts` keeps them equal.
 */
export const THEME_COLOR = '#427b73'

/**
 * The home-screen icon: the lotus mark alone, inside the maskable safe zone,
 * so one asset answers every slot and both manifest `purpose` values.
 */
export const APP_ICON = '/images/metadata/icon.png'
export const APP_ICON_SIZE = 1024
