/**
 * The component-side readers of `pageContext`: `useT`, `useLocale`,
 * `useOrigin`.
 *
 * `pages/+onBeforeRender.ts` fills `translations` from the CMS and
 * `passToClient` carries them into the browser, beside the locale and the
 * parsed URL Vike supplies itself.
 *
 * Outside a Vike app — Ladle, a unit test rendering a component bare —
 * there is no `pageContext`, so each reader falls back rather than throwing:
 * to the committed English snapshot, to the default locale, and, where no
 * default could be honest about which site we are, to `null`.
 */

import { usePageContext } from 'vike-react/usePageContext'
import type { PageContext } from 'vike/types'
import { DEFAULT_LOCALE, type Locale, type WebTranslations } from '../server/cms-types'
import { EN_TRANSLATIONS, getT, type TFunction } from '../lib/i18n'

/**
 * `pageContext`, or `null` where there is none.
 *
 * `usePageContext()` throws outside a Vike app. Ladle and the unit suite
 * both render components bare, so every consumer needs this guard.
 */
export function useOptionalPageContext(): PageContext | null {
  try {
    return usePageContext()
  } catch {
    return null
  }
}

export function useT(): TFunction {
  const pageContext = useOptionalPageContext()
  const locale: Locale = pageContext?.locale ?? DEFAULT_LOCALE
  const translations: WebTranslations =
    (pageContext?.translations as WebTranslations | undefined) ?? EN_TRANSLATIONS

  // `getT` memoizes per (translations, locale), so the whole tree shares
  // one accessor rather than allocating one per component instance.
  return getT(translations, locale)
}

/** The current locale, for `Intl` formatters. Falls back to the default. */
export function useLocale(): Locale {
  return useOptionalPageContext()?.locale ?? DEFAULT_LOCALE
}

/**
 * The origin serving this render, or `null` where there is no request.
 *
 * Unlike the locale, this has no sensible default: a guessed origin names a
 * site we may not be. A consumer gets `null` and declines to answer instead.
 */
export function useOrigin(): string | null {
  return useOptionalPageContext()?.urlParsed?.origin ?? null
}
