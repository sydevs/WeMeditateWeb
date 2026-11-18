/**
 * Who this site is, on the web outside it.
 *
 * The footer links these profiles and the `Organization` JSON-LD claims them
 * as `sameAs`. That is the claim tying the two together: a profile the footer
 * links and the markup omits is one search engines never associate with us.
 * One list is what keeps them the same set.
 *
 * TODO: Configure these from SahajCloud settings when the fields exist.
 */

import type { SocialLink } from '../components/organisms/Footer'

export const SOCIAL_PROFILES: readonly SocialLink[] = [
  { platform: 'facebook', href: 'https://facebook.com/wemeditate' },
  { platform: 'instagram', href: 'https://instagram.com/wemeditate' },
  { platform: 'youtube', href: 'https://youtube.com/wemeditate' },
]

/** The `twitter:site` account. An `@handle`, which is not a URL. */
export const TWITTER_HANDLE = '@wemeditate'
