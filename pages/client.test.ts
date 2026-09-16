import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * The client entry scrubs the token at module evaluation.
 *
 * `sentryBrowserConfig` scrubs too, and is mocked out here on purpose: this
 * spec is what fails if the entry's own call is deleted — the case where
 * Sentry is removed or disabled and nothing else is left to do it.
 */

vi.mock('../sentry.browser.config', () => ({ sentryBrowserConfig: vi.fn() }))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('the client entry', () => {
  it('takes the token out of the URL as it evaluates', async () => {
    const replaceState = vi.fn()

    vi.stubGlobal('window', {
      history: { replaceState, state: null },
      location: { href: 'https://x.test/about?live-preview=a.b.c' },
    })

    await import('./+client')

    expect(replaceState).toHaveBeenCalledWith(null, '', 'https://x.test/about')
  })
})
