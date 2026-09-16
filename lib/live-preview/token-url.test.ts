import { describe, expect, it } from 'vitest'

import { stripLivePreviewToken } from './token-url'

/**
 * ⚠ The token rides in a query string because an iframe navigation cannot
 * carry a header — so it lands everywhere a URL is recorded: the address bar,
 * `Referer`, Sentry replay, and Plausible, which reads `location.href` in JS
 * and posts it where no response header can reach.
 */
describe('stripLivePreviewToken', () => {
  it('removes the token', () => {
    expect(stripLivePreviewToken('https://x.test/about?live-preview=a.b')).toBe(
      'https://x.test/about',
    )
  })

  it('keeps every other parameter, and the hash', () => {
    // The scope is not a credential, and dropping the hash would silently move
    // an editor away from the anchor they were looking at.
    const scrubbed = stripLivePreviewToken(
      'https://x.test/fr/about?live-preview=a.b&scope=wm-web-translations&q=1#section',
    )

    expect(scrubbed).toBe('https://x.test/fr/about?scope=wm-web-translations&q=1#section')
  })

  it('leaves a URL without a token exactly as it was', () => {
    // Identity matters: the address-bar scrub compares against the original to
    // decide whether to touch history at all.
    const url = 'https://x.test/about?q=1'

    expect(stripLivePreviewToken(url)).toBe(url)
  })

  it('returns unparseable input unchanged rather than mangling it', () => {
    // Sentry hands breadcrumb values that are sometimes a bare path or a
    // label. Losing those protects nothing and discards information.
    for (const value of ['', '/about', 'navigation', 'not a url']) {
      expect(stripLivePreviewToken(value)).toBe(value)
    }
  })
})
