import { afterEach, describe, expect, it, vi } from 'vitest'

import { livePreviewToken, scrubAddressBar, stripLivePreviewToken } from './token-url'

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

/**
 * The token is deliberately absent from `passToClient`, so after the scrub the
 * URL it arrived in is gone and there is no second copy. The populate proxy
 * needs one, so the scrub catches it on the way past — in module state, never
 * in the page source.
 */
describe('livePreviewToken', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is null before any scrub, which is every ordinary page view', () => {
    expect(livePreviewToken()).toBeNull()
  })

  it('catches what the scrub is about to erase', () => {
    const replaceState = vi.fn()

    vi.stubGlobal('window', {
      history: { replaceState, state: null },
      location: { href: 'https://x.test/about?live-preview=a.b.c&scope=wm-web-config' },
    })

    scrubAddressBar()

    expect(livePreviewToken()).toBe('a.b.c')
    expect(replaceState).toHaveBeenCalledWith(null, '', 'https://x.test/about?scope=wm-web-config')
  })
})
