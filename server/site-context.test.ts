import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as Sentry from '@sentry/cloudflare'
import type { PageContextServer } from 'vike/types'
import { abortForkViews, hookViews } from '../tests/_helpers/page-context'
import { loadSiteContext, loadTranslations } from './site-context'
import { getWebConfig, getWebTranslations } from './sahajcloud-client'
import type { Locale, WebConfig, WebTranslations } from './sahajcloud-types'
import { createT, EN_TRANSLATIONS } from '../lib/i18n'

vi.mock('@sentry/cloudflare', () => ({ captureMessage: vi.fn() }))
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
    // What an unseeded SahajCloud returns. Rendering it would report every key as missing.
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

/**
 * The degrade warnings run on every render, so each is bounded per isolate.
 *
 * The isolate's memo outlives a test, so each case below degrades a locale no
 * other case uses: a reused one would already be reported.
 */
describe('translations degrade reporting', () => {
  const offering = (...locales: Locale[]) =>
    vi.mocked(getWebConfig).mockResolvedValue({ availableLocales: locales } as WebConfig)

  beforeEach(() => {
    vi.mocked(Sentry.captureMessage).mockClear()
    vi.restoreAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('sends one event per locale and reason, however many requests degrade', async () => {
    offering('de')
    vi.mocked(getWebTranslations).mockResolvedValue({} as WebTranslations)

    for (let request = 0; request < 3; request++) {
      const { inData, inOnBeforeRender } = await hookViews({ locale: 'de' })

      await loadSiteContext(inData)
      await loadTranslations(inOnBeforeRender)
    }

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1)
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Translations global is empty; rendering the English snapshot',
      expect.objectContaining({ extra: { locale: 'de' } }),
    )
    // The request log keeps the full record.
    expect(console.warn).toHaveBeenCalledTimes(3)
  })

  it('reports a second reason for the same locale', async () => {
    offering('it')
    vi.mocked(getWebTranslations).mockResolvedValue({} as WebTranslations)
    await loadSiteContext((await hookViews({ locale: 'it' })).inData)

    vi.mocked(getWebTranslations).mockRejectedValue(new Error('SahajCloud down'))
    await loadSiteContext((await hookViews({ locale: 'it' })).inData)

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(2)
  })

  it('says nothing to Sentry about a locale the site does not offer', async () => {
    // A crawler walking `/nl/…` reads an empty global on every request, and
    // each one 404s, error page included.
    offering('en')
    vi.mocked(getWebTranslations).mockResolvedValue({} as WebTranslations)

    const request = await hookViews({ locale: 'nl' })

    await expect(loadSiteContext(request.inData)).rejects.toThrow()
    await loadTranslations((await abortForkViews(request.target)).inOnBeforeRender)

    expect(Sentry.captureMessage).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalled()
  })

  it('reports from a render that reads no config, once the locale is known to be offered', async () => {
    // An embed: `+onBeforeRender` is the only reader.
    offering('en')
    await loadSiteContext((await hookViews({ locale: 'en' })).inData)
    vi.mocked(getWebTranslations).mockRejectedValue(new Error('SahajCloud down'))
    await loadTranslations((await hookViews({ locale: 'ru' })).inOnBeforeRender)

    expect(Sentry.captureMessage).not.toHaveBeenCalled()

    offering('en', 'ru')
    vi.mocked(getWebTranslations).mockResolvedValue(TRANSLATIONS)
    await loadSiteContext((await hookViews({ locale: 'ru' })).inData)
    vi.mocked(getWebTranslations).mockRejectedValue(new Error('SahajCloud down'))
    await loadTranslations((await hookViews({ locale: 'ru' })).inOnBeforeRender)

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Translations read failed; rendering the English snapshot',
      expect.objectContaining({ extra: { locale: 'ru' } }),
    )
  })
})

describe('a translation key SahajCloud lacks', () => {
  it('reaches Sentry once per key per isolate, from every render that misses it', () => {
    // Importing this module is what installs the reporter: `lib/` cannot.
    vi.mocked(Sentry.captureMessage).mockClear()
    const live = { blocks: { general: { learn_more: 'Mehr' } } } as unknown as WebTranslations

    createT(live, 'de')('blocks.general.minutes')
    createT(live, 'de')('blocks.general.minutes')
    createT({ ...live }, 'fr')('blocks.general.minutes')

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1)
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Translation key missing from SahajCloud',
      expect.objectContaining({
        tags: { source: 'i18n', fallback: 'mirror' },
        extra: { key: 'blocks.general.minutes', locale: 'de' },
      }),
    )
  })
})
