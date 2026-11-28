import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as Sentry from '@sentry/cloudflare'
import type { PageContextServer } from 'vike/types'
import { abortForkViews, hookViews } from '@/tests/_helpers/page-context'
import { loadSiteContext, loadTranslations } from './site-context'
import { getWebConfig, getWebTranslations } from './sahajcloud'
import { forgetReportedWarnings } from './error-utils'
import type { Locale, WebConfig } from '@/types/sahajcloud'
import type { SahajCloudWebTranslations, WebTranslations } from '@/lib/i18n/web-translations'
import { createT, EN_TRANSLATIONS, type TranslationKey } from '@/lib/i18n/i18n'
import { a11yStringsFor } from '@/lib/i18n/a11y/catalog'

vi.mock('@sentry/cloudflare', () => ({ captureMessage: vi.fn() }))
vi.mock('./sahajcloud', () => ({
  getWebTranslations: vi.fn(),
  getWebConfig: vi.fn(),
}))

/**
 * One SahajCloud read per request, across the two objects vike hands one request.
 *
 * Keying the memos on the argument read `wm-web-translations` twice per chromed
 * render (#108). `hookViews` builds the pair with vike's own wrapper.
 */

const TRANSLATIONS = { common: { close: 'Close' } } as unknown as SahajCloudWebTranslations
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
    vi.mocked(getWebTranslations).mockResolvedValue({} as SahajCloudWebTranslations)

    expect(await loadTranslations((await hookViews({ locale: 'en' })).inData)).toStrictEqual(
      EN_TRANSLATIONS,
    )
  })

  it('degrades to the English snapshot when the read fails', async () => {
    vi.mocked(getWebTranslations).mockRejectedValue(new Error('SahajCloud down'))

    expect(await loadTranslations((await hookViews({ locale: 'en' })).inData)).toStrictEqual(
      EN_TRANSLATIONS,
    )
  })

  it("mounts the locale's screen-reader strings beside SahajCloud's", async () => {
    vi.mocked(getWebTranslations).mockResolvedValue({
      common: { general: { loading: 'Chargement' } },
    } as unknown as SahajCloudWebTranslations)

    const translations = await loadTranslations((await hookViews({ locale: 'fr' })).inData)

    expect(translations.common.a11y).toEqual(a11yStringsFor('fr').common)
    expect((translations.common as { general: { loading: string } }).general.loading).toBe(
      'Chargement',
    )
  })

  it("keeps the visitor's screen-reader language when it falls back to English", async () => {
    vi.mocked(getWebTranslations).mockRejectedValue(new Error('SahajCloud down'))

    const translations = await loadTranslations((await hookViews({ locale: 'de' })).inData)

    expect(translations.media.a11y).toEqual(a11yStringsFor('de').media)
    expect(translations.common.general).toBe(EN_TRANSLATIONS.common.general)
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

/** The degrade warnings run on every render, so each is bounded per isolate. */
describe('translations degrade reporting', () => {
  const offering = (...locales: Locale[]) =>
    vi.mocked(getWebConfig).mockResolvedValue({ availableLocales: locales } as WebConfig)

  beforeEach(() => {
    forgetReportedWarnings()
    vi.mocked(Sentry.captureMessage).mockClear()
    vi.restoreAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('sends one event per locale and reason, however many requests degrade', async () => {
    offering('de')
    vi.mocked(getWebTranslations).mockResolvedValue({} as SahajCloudWebTranslations)

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
    vi.mocked(getWebTranslations).mockResolvedValue({} as SahajCloudWebTranslations)
    await loadSiteContext((await hookViews({ locale: 'it' })).inData)

    vi.mocked(getWebTranslations).mockRejectedValue(new Error('SahajCloud down'))
    await loadSiteContext((await hookViews({ locale: 'it' })).inData)

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(2)
  })

  it('reports a locale the site does not offer, once across the 404 and its error page', async () => {
    // A crawler walking `/nl/…` reads an empty global on every request, and
    // each one 404s. The read still degraded, so the gap is still real.
    offering('en')
    vi.mocked(getWebTranslations).mockResolvedValue({} as SahajCloudWebTranslations)

    const request = await hookViews({ locale: 'nl' })

    await expect(loadSiteContext(request.inData)).rejects.toThrow()
    await loadTranslations((await abortForkViews(request.target)).inOnBeforeRender)

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1)
    expect(console.warn).toHaveBeenCalled()
  })

  it('reports from a render that reads no config at all', async () => {
    // An embed: `+onBeforeRender` is the only reader, so nothing here knows
    // which locales the site offers. A degrade is reported where it is found.
    vi.mocked(getWebTranslations).mockRejectedValue(new Error('SahajCloud down'))

    await loadTranslations((await hookViews({ locale: 'ru' })).inOnBeforeRender)

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Translations read failed; rendering the English snapshot',
      expect.objectContaining({ extra: { locale: 'ru' } }),
    )
  })
})

describe('a translation key SahajCloud lacks', () => {
  // Importing this module is what installs the reporter: `lib/` cannot.
  const partial = (locale: Locale) =>
    createT({ blocks: { general: { learn_more: 'Mehr' } } } as unknown as WebTranslations, locale)

  beforeEach(() => {
    forgetReportedWarnings()
    vi.mocked(Sentry.captureMessage).mockClear()
  })

  it('says nothing when the mirror filled it for a locale other than English', () => {
    // SahajCloud #705 fills only inside a group the locale carries, so most
    // of the 19 locales render English for some keys by design.
    partial('de')('blocks.general.minutes')
    partial('fr')('blocks.general.minutes')

    expect(Sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('reports a key English itself lacks', () => {
    partial('en')('blocks.general.minutes')

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Translation key missing from SahajCloud',
      expect.objectContaining({
        tags: { source: 'i18n', fallback: 'mirror' },
        extra: { key: 'blocks.general.minutes', locale: 'en' },
      }),
    )
  })

  it('reports a key no source holds, whatever the locale', () => {
    partial('de')('blocks.general.no_such_key' as TranslationKey)

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Translation key missing from SahajCloud',
      expect.objectContaining({ tags: { source: 'i18n', fallback: 'none' } }),
    )
  })

  it('reaches Sentry once per key per isolate, from every render that misses it', () => {
    partial('en')('blocks.general.minutes')
    partial('en')('blocks.general.minutes')
    partial('en')('blocks.general.minutes')

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1)
  })
})
