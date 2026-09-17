import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PageContextServer } from 'vike/types'
import { loadSiteContext, loadTranslations } from './site-context'
import { getWebConfig, getWebTranslations } from './cms-client'

vi.mock('@sentry/react', () => ({ captureMessage: vi.fn() }))
vi.mock('./cms-client', () => ({
  getWebTranslations: vi.fn(),
  getWebConfig: vi.fn(),
}))

/**
 * One CMS read per request, across hooks that are handed different objects.
 *
 * `data()` and `+onBeforeRender` never share a `pageContext`: vike wraps the
 * request's object in a fresh proxy for each. Keying the memos on the argument
 * therefore read `wm-web-translations` twice per chromed render (#108). These
 * cases stand in for that pair with two proxies over one target, which is the
 * shape `server/request-memo.test.ts` pins against vike itself.
 */

const TRANSLATIONS = { common: { close: 'Close' } }
const CONFIG = { availableLocales: ['en'] }

/** One request, as vike's two hooks see it. */
function hookViews() {
  const request = { locale: 'en' }
  const asHook = () =>
    new Proxy(request, {
      get: (target, prop) => (prop === '_originalObject' ? target : target[prop as 'locale']),
    }) as unknown as PageContextServer

  return { request, inData: asHook(), inOnBeforeRender: asHook() }
}

beforeEach(() => {
  vi.mocked(getWebTranslations).mockReset().mockResolvedValue(TRANSLATIONS as never)
  vi.mocked(getWebConfig).mockReset().mockResolvedValue(CONFIG as never)
})

describe('loadTranslations', () => {
  it('reads the translations global once across two hooks of one request', async () => {
    const { inData, inOnBeforeRender } = hookViews()

    const first = await loadTranslations(inData)
    const second = await loadTranslations(inOnBeforeRender)

    expect(getWebTranslations).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
  })

  it('still memoises when `pageContext` is not a proxy', async () => {
    // What a unit test and Ladle pass. `_originalObject` is absent there.
    const plain = { locale: 'en' } as unknown as PageContextServer

    await loadTranslations(plain)
    await loadTranslations(plain)

    expect(getWebTranslations).toHaveBeenCalledTimes(1)
  })

  it('reads again for a second request', async () => {
    await loadTranslations(hookViews().inData)
    await loadTranslations(hookViews().inData)

    expect(getWebTranslations).toHaveBeenCalledTimes(2)
  })
})

describe('loadSiteContext', () => {
  it('reads the config global once across two hooks of one request', async () => {
    const { inData, inOnBeforeRender } = hookViews()

    const first = await loadSiteContext(inData)
    const second = await loadSiteContext(inOnBeforeRender)

    expect(getWebConfig).toHaveBeenCalledTimes(1)
    expect(getWebTranslations).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
  })

  it('shares its translations read with the hook that asks separately', async () => {
    // The sharper risk the memo removes: two snapshots of one global in one
    // response, one baked into `data` and one carried by `passToClient`.
    const { inData, inOnBeforeRender } = hookViews()

    const context = await loadSiteContext(inData)
    const carried = await loadTranslations(inOnBeforeRender)

    expect(getWebTranslations).toHaveBeenCalledTimes(1)
    expect(carried).toBe(context.translations)
  })
})
