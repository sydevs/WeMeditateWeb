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
import { useMemo } from 'react'
import type { Locale, WebTranslations } from '../server/cms-types'
import { createT, EN_TRANSLATIONS, type TFunction } from '../lib/i18n'

export function useT(): TFunction {
  let pageContext

  try {
    pageContext = usePageContext()
  } catch {
    // No pageContext: Ladle, or a component rendered outside the app.
    pageContext = null
  }

  const locale: Locale = pageContext?.locale ?? 'en'
  const translations: WebTranslations =
    (pageContext?.translations as WebTranslations | undefined) ?? EN_TRANSLATIONS

  return useMemo(() => createT(translations, locale), [translations, locale])
}

/** The current locale, for `Intl` formatters. Falls back to `en`. */
export function useLocale(): Locale {
  let pageContext

  try {
    pageContext = usePageContext()
  } catch {
    pageContext = null
  }

  return pageContext?.locale ?? 'en'
}
