/**
 * One read of each site global per request.
 *
 * Every page needs `wm-web-translations` (every UI string), and every
 * chromed page also needs `wm-web-config` (navigation, audiences, the
 * locale set). Each `+data.ts` used to call `getWebConfig` itself, so
 * adding a second global would have doubled the per-request reads.
 *
 * The two globals are memoised **separately**, both keyed on the
 * `pageContext` object. That split matters: `+onBeforeRender` runs for
 * every route including the embed ones, which deliberately fetch no config
 * ("there is no nav to populate"). Loading them together would have made
 * every iframe embed pay for a populated config read it never renders.
 *
 * Vike creates a fresh `pageContext` per request, so `WeakMap` entries
 * cannot leak between requests and the maps need no clearing.
 */

import { render } from 'vike/abort'
import * as Sentry from '@sentry/react'
import type { PageContextServer } from 'vike/types'
import { getWebConfig, getWebTranslations } from './cms-client'
import type { Locale, WebConfig, WebTranslations } from './cms-types'
import { createT, EN_TRANSLATIONS, type TFunction } from '../lib/i18n'

export interface SiteContext {
  settings: WebConfig
  translations: WebTranslations
  locale: Locale
  /** The accessor bound to this request's locale and strings. */
  t: TFunction
}

const translationsCache = new WeakMap<object, Promise<WebTranslations>>()
const contextCache = new WeakMap<object, Promise<SiteContext>>()

/** True when the global carries no strings at all, at any depth. */
function isEmpty(translations: WebTranslations): boolean {
  const hasString = (node: unknown): boolean => {
    if (typeof node === 'string') return node.trim().length > 0
    if (node === null || typeof node !== 'object') return false

    return Object.values(node).some(hasString)
  }

  return !hasString(translations)
}

/**
 * Loads the locale's UI strings, once per request.
 *
 * Degrades to the committed English snapshot in two cases, both of which
 * would otherwise render every string as its own key path:
 *
 * - the read fails, and
 * - the read succeeds but the global is empty, which is what an unseeded
 *   CMS returns. Per-key gaps are not this function's business — the CMS
 *   fills a blank key from English on every API-client read (SahajCloud
 *   #705) — but a global with nothing in it is not usable at all.
 *
 * Both paths log a Sentry warning, so the gap stays visible.
 */
export function loadTranslations(pageContext: PageContextServer): Promise<WebTranslations> {
  const existing = translationsCache.get(pageContext)
  if (existing) return existing

  const locale = pageContext.locale
  const loading = getWebTranslations({ locale })
    .then((translations) => {
      if (!isEmpty(translations)) return translations

      console.warn(`[loadTranslations] "${locale}" returned no strings; using the English snapshot`)
      Sentry.captureMessage('Translations global is empty; rendering the English snapshot', {
        level: 'warning',
        tags: { source: 'loadTranslations' },
        extra: { locale },
      })

      return EN_TRANSLATIONS
    })
    .catch((error: unknown) => {
      console.warn(`[loadTranslations] read failed for "${locale}":`, error)
      Sentry.captureMessage('Translations read failed; rendering the English snapshot', {
        level: 'warning',
        tags: { source: 'loadTranslations' },
        extra: { locale },
      })

      return EN_TRANSLATIONS
    })

  translationsCache.set(pageContext, loading)

  return loading
}

/**
 * Loads the site config and the locale's UI strings, once per request.
 *
 * Throws Vike's 404 when the URL carries a locale the site does not offer.
 * `getWebConfig` normalises an unconfigured `availableLocales` to `['en']`,
 * so English always resolves.
 *
 * A config read that fails still propagates — without it there is no
 * navigation and no home page, so the error page is the honest answer.
 */
export function loadSiteContext(pageContext: PageContextServer): Promise<SiteContext> {
  const existing = contextCache.get(pageContext)
  if (existing) return existing

  const loading = load(pageContext)
  contextCache.set(pageContext, loading)

  return loading
}

async function load(pageContext: PageContextServer): Promise<SiteContext> {
  const locale = pageContext.locale

  const [settings, translations] = await Promise.all([
    getWebConfig({ locale }),
    loadTranslations(pageContext),
  ])

  // A locale prefix the site does not offer is not a page. 404 rather than
  // rendering English under a French URL.
  if (!settings.availableLocales.includes(locale)) {
    throw render(404, `Locale "${locale}" is not available.`)
  }

  return { settings, translations, locale, t: createT(translations, locale) }
}
