import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PageContextServer } from 'vike/types'
import { hookViews } from '../tests/_helpers/page-context'
import { loadSiteContext, loadTranslations } from './site-context'
import { getWebConfig, getWebTranslations } from './sahajcloud-client'
import type { WebConfig, WebTranslations } from './sahajcloud-types'
import { EN_TRANSLATIONS } from '../lib/i18n'

vi.mock('@sentry/react', () => ({ captureMessage: vi.fn() }))
vi.mock('./sahajcloud-client', () => ({
  getWebTranslations: vi.fn(),
  getWebConfig: vi.fn(),
}))

/**
 * One SahajCloud read per request, across the two objects vike hands one request.
 *
 * Keying the memos on the argument read `wm-web-translations` twice per chromed
 * render (#108). `hookViews` builds the pair with vike's own wrapper.
 */

const TRANSLATIONS = { common: { close: 'Close' } } as unknown as WebTranslations
const CONFIG = { availableLocales: ['en'] } as unknown as WebConfig

beforeEach(() => {
  vi.mocked(getWebTranslations).mockReset()
  vi.mocked(getWebTranslations).mockResolvedValue(TRANSLATIONS)
  vi.mocked(getWebConfig).mockReset()
  vi.mocked(getWebConfig).mockResolvedValue(CONFIG)
})

describe('loadTranslations', () => {
  it('reads the translations global once across both hooks of one request', async () => {
    const { inData, inOnBeforeRender } = await hookViews({ locale: 'en' })

    const first = await loadTranslations(inData)
    const second = await loadTranslations(inOnBeforeRender)

    expect(getWebTranslations).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
  })

  it('still memoises when `pageContext` is not a proxy', async () => {
    const plain = { locale: 'en' } as unknown as PageContextServer

    await loadTranslations(plain)
    await loadTranslations(plain)

    expect(getWebTranslations).toHaveBeenCalledTimes(1)
  })

  it('reads again for a second request', async () => {
    await loadTranslations((await hookViews({ locale: 'en' })).inData)
    await loadTranslations((await hookViews({ locale: 'en' })).inData)

    expect(getWebTranslations).toHaveBeenCalledTimes(2)
  })

  it('degrades to the English snapshot when the global is empty', async () => {
    // What an unseeded SahajCloud returns. Rendering it would print every key path.
    vi.mocked(getWebTranslations).mockResolvedValue({} as WebTranslations)

    expect(await loadTranslations((await hookViews({ locale: 'en' })).inData)).toBe(EN_TRANSLATIONS)
  })

  it('degrades to the English snapshot when the read fails', async () => {
    vi.mocked(getWebTranslations).mockRejectedValue(new Error('SahajCloud down'))

    expect(await loadTranslations((await hookViews({ locale: 'en' })).inData)).toBe(EN_TRANSLATIONS)
  })
})

describe('loadSiteContext', () => {
  it('reads the config global once across both hooks of one request', async () => {
    const { inData, inOnBeforeRender } = await hookViews({ locale: 'en' })

    const first = await loadSiteContext(inData)
    const second = await loadSiteContext(inOnBeforeRender)

    expect(getWebConfig).toHaveBeenCalledTimes(1)
    expect(getWebTranslations).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
  })

  it('shares its translations read with the hook that asks separately', async () => {
    // The sharper risk the memo removes: two snapshots of one global in one
    // response, one baked into `data` and one carried by `passToClient`.
    const { inData, inOnBeforeRender } = await hookViews({ locale: 'en' })

    const context = await loadSiteContext(inData)
    const carried = await loadTranslations(inOnBeforeRender)

    expect(getWebTranslations).toHaveBeenCalledTimes(1)
    expect(carried).toBe(context.translations)
  })

  it('404s a locale the site does not offer', async () => {
    const { inData } = await hookViews({ locale: 'fr' })

    await expect(loadSiteContext(inData)).rejects.toThrow()
  })
})
