/**
 * One read of each site global per request.
 *
 * Every page needs `wm-web-translations` (every UI string), and every
 * chromed page also needs `wm-web-config` (navigation, audiences, the
 * locale set). Each `+data.ts` used to call `getWebConfig` itself, so
 * adding a second global would have doubled the per-request reads.
 *
 * The two globals are memoised **separately**. That split matters:
 * `+onBeforeRender` runs for every route including the embed ones, which
 * deliberately fetch no config ("there is no nav to populate"). Loading them
 * together would have made every iframe embed pay for a populated config read
 * it never renders.
 *
 * Both go through `perRequest` (`server/request-memo.ts`), which owns the
 * keying and the lifetime.
 */

import { render } from 'vike/abort'
import * as Sentry from '@sentry/cloudflare'
import type { PageContextServer } from 'vike/types'
import { getWebConfig, getWebTranslations } from './sahajcloud-client'
import { loadLivePreview, previewArgs } from './live-preview'
import { perRequest } from './request-memo'
import type { Locale, WebConfig, WebTranslations } from './sahajcloud-types'
import { EN_TRANSLATIONS, getT, type TFunction } from '../lib/i18n'

export interface SiteContext {
  settings: WebConfig
  translations: WebTranslations
  locale: Locale
  /** The accessor bound to this request's locale and strings. */
  t: TFunction
}

/** Why a read rendered the English snapshot instead of the locale's strings. */
type Degrade = 'empty' | 'failed'

interface TranslationsRead {
  translations: WebTranslations
  degraded?: Degrade
}

const translationsCache = new WeakMap<object, Promise<TranslationsRead>>()
const contextCache = new WeakMap<object, Promise<SiteContext>>()

/**
 * What this isolate has already sent to Sentry. A degrade recurs on every
 * render until someone fixes it upstream, so each reports once per isolate
 * (server/AGENTS.md). The domain is finite — the locales times two reasons —
 * so it needs no cap.
 */
const reportedDegrades = new Set<string>()

/**
 * The locales the site offered at this isolate's last config read.
 *
 * An embed or an error page renders without reading the config, so this is
 * how it tells a locale the site offers from one it does not. Empty until
 * the first chromed render, and nothing is reported from those renders until
 * then.
 */
let lastOfferedLocales: readonly Locale[] = []

function reportDegrade(locale: Locale, reason: Degrade): void {
  const signature = `${locale}:${reason}`

  if (reportedDegrades.has(signature)) return

  reportedDegrades.add(signature)
  Sentry.captureMessage(
    reason === 'empty'
      ? 'Translations global is empty; rendering the English snapshot'
      : 'Translations read failed; rendering the English snapshot',
    { level: 'warning', tags: { source: 'loadTranslations' }, extra: { locale } },
  )
}

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
 * Degrades to the committed English snapshot in two cases:
 *
 * - the read fails, and
 * - the read succeeds but the global is empty, which is what an unseeded
 *   SahajCloud returns, and what a locale nobody has translated reads as.
 *
 * ⚠ A partly published locale passes both tests. SahajCloud's English fill
 * reaches only inside a group the document already carries (SahajCloud
 * #705), so a locale holding one group of fourteen renders the other
 * thirteen from this repo's English mirror, which trails the live English.
 * A locale is published with every group present, even blank.
 *
 * Either degrade logs on every request, and reaches Sentry once per locale
 * and reason per isolate — and only for a locale the site offers: a chromed
 * request in any other locale 404s, and an embed in one renders the snapshot
 * by design.
 */
export async function loadTranslations(pageContext: PageContextServer): Promise<WebTranslations> {
  const { translations, degraded } = await readTranslations(pageContext)

  if (degraded && lastOfferedLocales.includes(pageContext.locale)) {
    reportDegrade(pageContext.locale, degraded)
  }

  return translations
}

function readTranslations(pageContext: PageContextServer): Promise<TranslationsRead> {
  const locale = pageContext.locale

  return perRequest(translationsCache, pageContext, () =>
    loadLivePreview(pageContext)
      .then((preview) =>
        // Only under the `wm-web-translations` scope: a preview of a PAGE
        // should render that page's draft inside the published chrome an
        // ordinary visitor sees, not a second document's unsaved edits.
        getWebTranslations({ locale, ...previewArgs(preview, 'wm-web-translations') }),
      )
      .then((translations): TranslationsRead => {
        if (!isEmpty(translations)) return { translations }

        console.warn(
          `[loadTranslations] "${locale}" returned no strings; using the English snapshot`,
        )

        return { translations: EN_TRANSLATIONS, degraded: 'empty' }
      })
      .catch((error: unknown): TranslationsRead => {
        console.warn(`[loadTranslations] read failed for "${locale}":`, error)

        return { translations: EN_TRANSLATIONS, degraded: 'failed' }
      }),
  )
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
  return perRequest(contextCache, pageContext, () => load(pageContext))
}

async function load(pageContext: PageContextServer): Promise<SiteContext> {
  const locale = pageContext.locale

  const preview = await loadLivePreview(pageContext)

  const [settings, { translations, degraded }] = await Promise.all([
    getWebConfig({ locale }),
    readTranslations(pageContext),
  ])

  lastOfferedLocales = settings.availableLocales
  const offered = settings.availableLocales.includes(locale)

  // A locale prefix the site does not offer is not a page. 404 rather than
  // rendering English under a French URL.
  //
  // ⚠ **Except under preview.** `availableLocales` is gated on translations
  // being PUBLISHED, so a translator working on a brand-new locale would 404
  // before rendering a single string — the one case they most need to see.
  // The gate exists to stop the PUBLIC meeting a half-translated site; an
  // authenticated preview is precisely who it should not apply to.
  if (!preview.active && !offered) {
    throw render(404, `Locale "${locale}" is not available.`)
  }

  if (degraded && offered) reportDegrade(locale, degraded)

  // `getT`, not `createT`: `useT()` builds the component tree's accessor the
  // same way, so both sides of a render share one closure pair per request.
  return { settings, translations, locale, t: getT(translations, locale) }
}
