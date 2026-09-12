/**
 * One read of the two site globals per request.
 *
 * Every page needs both `wm-web-config` (navigation, audiences, the locale
 * set) and `wm-web-translations` (every UI string). Each `+data.ts` used to
 * call `getWebConfig` itself, so adding a second global would have doubled
 * the per-request reads. `loadSiteContext` fetches both once, in parallel,
 * and memoises the promise on the `pageContext` object, so the six data
 * functions and `+onBeforeRender` share one result.
 *
 * The memo is a `WeakMap` keyed by `pageContext`. Vike creates a fresh
 * `pageContext` per request, so entries cannot leak between requests, and
 * the map does not need clearing.
 */

import { render } from 'vike/abort'
import * as Sentry from '@sentry/react'
import type { PageContextServer } from 'vike/types'
import { getWebConfig, getWebTranslations } from './cms-client'
import type { Locale, WebConfig, WebTranslations } from './cms-types'
import { EN_TRANSLATIONS } from '../lib/i18n'

export interface SiteContext {
  settings: WebConfig
  translations: WebTranslations
  locale: Locale
}

const cache = new WeakMap<object, Promise<SiteContext>>()

/**
 * Loads the site config and the locale's UI strings, once per request.
 *
 * Throws Vike's 404 when the URL carries a locale the site does not offer.
 * `getWebConfig` normalises an unconfigured `availableLocales` to `['en']`,
 * so English always resolves.
 *
 * A translations read that fails degrades to the committed English
 * snapshot with a Sentry warning: a page in slightly wrong language beats
 * an error page. A config read that fails still propagates — without it
 * there is no navigation and no home page.
 */
export function loadSiteContext(pageContext: PageContextServer): Promise<SiteContext> {
  const existing = cache.get(pageContext)
  if (existing) return existing

  const loading = load(pageContext)
  cache.set(pageContext, loading)

  return loading
}

async function load(pageContext: PageContextServer): Promise<SiteContext> {
  const locale = pageContext.locale

  const [settings, translations] = await Promise.all([
    getWebConfig({ locale }),
    getWebTranslations({ locale }).catch((error: unknown) => {
      console.warn(`[loadSiteContext] translations read failed for "${locale}":`, error)
      Sentry.captureMessage('Translations read failed; rendering the English snapshot', {
        level: 'warning',
        tags: { source: 'loadSiteContext' },
        extra: { locale },
      })

      return EN_TRANSLATIONS
    }),
  ])

  // A locale prefix the site does not offer is not a page. 404 rather than
  // rendering English under a French URL.
  if (!settings.availableLocales.includes(locale)) {
    throw render(404, `Locale "${locale}" is not available.`)
  }

  return { settings, translations, locale }
}
