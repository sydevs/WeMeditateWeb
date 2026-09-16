import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { sentryBrowserConfig } from './sentry.browser.config'

/**
 * The invariant: **the live-preview token is out of `location.href` before
 * Sentry initialises.**
 *
 * This used to rest on the order of two calls in `pages/+client.ts`, written
 * above their own imports and working only by ESM hoisting — a comment was the
 * whole enforcement, and any import-sorting rule would have undone it with
 * nothing turning red. `sentryBrowserConfig` now scrubs as its own first
 * statement, and these specs are what fails if that statement moves below
 * `Sentry.init` or is deleted.
 */

const { hrefAtInit, init } = vi.hoisted(() => ({
  hrefAtInit: { value: null as string | null },
  init: vi.fn(),
}))

vi.mock('@sentry/react', () => ({
  // Records what `location.href` was AT THE MOMENT Sentry started, which is
  // the only question this file asks. Asserting on the URL afterwards would
  // pass even if the scrub ran second.
  init: (options: unknown) => {
    hrefAtInit.value = window.location.href
    init(options)
  },
  replayIntegration: () => ({ name: 'Replay' }),
}))

/**
 * A window whose `replaceState` moves `location.href`, as a browser's does.
 *
 * Without that, `location.href` would still read the token after the scrub and
 * the spec would fail for a reason that has nothing to do with the code.
 */
function stubBrowser(href: string) {
  const location = { href }
  const replaceState = vi.fn((_state: unknown, _title: string, url: string) => {
    location.href = url
  })

  vi.stubGlobal('window', { history: { replaceState, state: null }, location })

  return { location, replaceState }
}

beforeEach(() => {
  init.mockReset()
  hrefAtInit.value = null
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('sentryBrowserConfig', () => {
  it('scrubs the token before Sentry initialises', () => {
    vi.stubEnv('PROD', true)

    const { location } = stubBrowser('https://x.test/about?live-preview=a.b.c&scope=wm-web-config')

    sentryBrowserConfig()

    expect(init).toHaveBeenCalledTimes(1)
    expect(hrefAtInit.value).toBe('https://x.test/about?scope=wm-web-config')
    expect(location.href).toBe('https://x.test/about?scope=wm-web-config')
  })

  it('scrubs even when Sentry is switched off, because it is not a Sentry feature', () => {
    // `import.meta.env.PROD` is false outside a production build, so `init`
    // never runs — and the scrub still must, for every other URL reader.
    const { location } = stubBrowser('https://x.test/about?live-preview=a.b.c')

    sentryBrowserConfig()

    expect(init).not.toHaveBeenCalled()
    expect(location.href).toBe('https://x.test/about')
  })

  it('leaves an ordinary page view untouched', () => {
    vi.stubEnv('PROD', true)

    const { location, replaceState } = stubBrowser('https://x.test/about?q=1')

    sentryBrowserConfig()

    expect(replaceState).not.toHaveBeenCalled()
    expect(location.href).toBe('https://x.test/about?q=1')
    expect(hrefAtInit.value).toBe('https://x.test/about?q=1')
  })
})
