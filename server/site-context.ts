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
import type { PageContextServer } from 'vike/types'
import { getWebConfig, getWebTranslations } from './sahajcloud'
import { warnOnce } from './error-utils'
import { loadLivePreview, previewArgs } from './live-preview'
import { perRequest } from './request-memo'
import type { Locale, WebConfig } from '@/types/sahajcloud'
import { DEFAULT_LOCALE } from '@/lib/i18n/locales'
import type { SahajCloudWebTranslations, WebTranslations } from '@/lib/i18n/web-translations'
import {
  EN_TRANSLATIONS,
  getT,
  setMissingTranslationReporter,
  type TFunction,
} from '@/lib/i18n/i18n'
import { withA11y } from '@/lib/i18n/a11y/a11y'
import { a11yStringsFor } from '@/lib/i18n/a11y/catalog'

export interface SiteContext {
  settings: WebConfig
  translations: WebTranslations
  locale: Locale
  /** The accessor bound to this request's locale and strings. */
  t: TFunction
}

const translationsCache = new WeakMap<object, Promise<WebTranslations>>()
const contextCache = new WeakMap<object, Promise<SiteContext>>()

// Installed on import: every route's `+onBeforeRender` imports this module,
// so it is in place before the first lookup. `lib/i18n` cannot report for
// itself — ESLint refuses it an `@/server/*` import, and `error-utils` reaches
// Sentry through `@sentry/cloudflare`, which no browser bundle can take.
//
// Only a gap nobody can translate away is reported. A non-English locale
// rendering English for one key is SahajCloud #705's designed outcome across
// most of the 19 locales, so an event for it would bill the expected path.
// What is left is a fault: English itself missing the key, or no source
// holding it at all, which renders nothing.
//
// shortcut: the oembed and manifest routes build an accessor without importing
// this module, so a miss there reports nothing; move the install once either
// renders more than a name.
setMissingTranslationReporter(({ key, locale, inMirror }) => {
  if (inMirror && locale !== DEFAULT_LOCALE) return

  warnOnce(key, 'Translation key missing from SahajCloud', {
    source: 'i18n',
    tags: { fallback: inMirror ? 'mirror' : 'none' },
    // The locale of the render that first missed it in this isolate, not the
    // only one affected.
    extra: { key, locale },
  })
})

/** True when the global carries no strings at all, at any depth. */
function isEmpty(translations: SahajCloudWebTranslations): boolean {
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
 * Either degrade logs on every request, and reaches Sentry through
 * `warnOnce` — once per locale and reason per isolate, from whichever render
 * discovers it.
 *
 * Whichever strings result, the locale's screen-reader strings are mounted on
 * them last, so even the English fallback speaks the visitor's language there.
 */
export function loadTranslations(pageContext: PageContextServer): Promise<WebTranslations> {
  const locale = pageContext.locale

  return perRequest(translationsCache, pageContext, () =>
    loadLivePreview(pageContext)
      .then((preview) =>
        // Only under the `wm-web-translations` scope: a preview of a PAGE
        // should render that page's draft inside the published chrome an
        // ordinary visitor sees, not a second document's unsaved edits.
        getWebTranslations({ locale, ...previewArgs(preview, 'wm-web-translations') }),
      )
      .then((translations) => {
        if (!isEmpty(translations)) return translations

        console.warn(
          `[loadTranslations] "${locale}" returned no strings; using the English snapshot`,
        )
        warnOnce(locale, 'Translations global is empty; rendering the English snapshot', {
          source: 'loadTranslations',
          extra: { locale },
        })

        return EN_TRANSLATIONS
      })
      .catch((error: unknown) => {
        console.warn(`[loadTranslations] read failed for "${locale}":`, error)
        warnOnce(locale, 'Translations read failed; rendering the English snapshot', {
          source: 'loadTranslations',
          extra: { locale },
        })

        return EN_TRANSLATIONS
      })
      .then((translations) => withA11y<WebTranslations>(translations, a11yStringsFor(locale))),
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

  const [settings, translations] = await Promise.all([
    getWebConfig({ locale }),
    loadTranslations(pageContext),
  ])

  // A locale prefix the site does not offer is not a page. 404 rather than
  // rendering English under a French URL.
  //
  // ⚠ **Except under preview.** `availableLocales` is gated on translations
  // being PUBLISHED, so a translator working on a brand-new locale would 404
  // before rendering a single string — the one case they most need to see.
  // The gate exists to stop the PUBLIC meeting a half-translated site; an
  // authenticated preview is precisely who it should not apply to.
  if (!preview.active && !settings.availableLocales.includes(locale)) {
    throw render(404, `Locale "${locale}" is not available.`)
  }

  // `getT`, not `createT`: `useT()` builds the component tree's accessor the
  // same way, so both sides of a render share one closure pair per request.
  return { settings, translations, locale, t: getT(translations, locale) }
}
