/**
 * `useT()` — the component-side translation accessor.
 *
 * Reads `translations` and `locale` off `pageContext`, which
 * `pages/+onBeforeRender.ts` fills from the CMS and `passToClient` carries
 * into the browser.
 *
 * Outside a Vike app — Ladle, a unit test rendering a component bare —
 * there is no `pageContext`, so this falls back to the committed English
 * snapshot rather than throwing. That mirrors `Link.tsx:75-81`.
 */

import { usePageContext } from 'vike-react/usePageContext'
import type { PageContext } from 'vike/types'
import type { Locale, WebTranslations } from '../server/cms-types'
import { EN_TRANSLATIONS, getT, type TFunction } from '../lib/i18n'

/**
 * `pageContext`, or `null` where there is none.
 *
 * `usePageContext()` throws outside a Vike app. Ladle and the unit suite
 * both render components bare, so every consumer needs this guard — see
 * the same shape in `components/atoms/Link/Link.tsx:75-81`.
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
  const locale: Locale = pageContext?.locale ?? 'en'
  const translations: WebTranslations =
    (pageContext?.translations as WebTranslations | undefined) ?? EN_TRANSLATIONS

  // `getT` memoizes per (translations, locale), so the whole tree shares
  // one accessor rather than allocating one per component instance.
  return getT(translations, locale)
}

/** The current locale, for `Intl` formatters. Falls back to `en`. */
export function useLocale(): Locale {
  return useOptionalPageContext()?.locale ?? 'en'
}
