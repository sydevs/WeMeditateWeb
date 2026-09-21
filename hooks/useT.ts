/**
 * `useT`, the component-side translation accessor.
 *
 * `pages/+onBeforeRender.ts` fills `translations` from the CMS and
 * `passToClient` carries them into the browser. Outside a Vike app — Ladle, a
 * unit test rendering a component bare — there is none, so this falls back to
 * the committed English snapshot.
 *
 * The other `pageContext` readers live in `hooks/usePageContext.ts`.
 */

import { DEFAULT_LOCALE, type Locale, type WebTranslations } from '../server/cms-types'
import { EN_TRANSLATIONS, getT, type TFunction } from '../lib/i18n'
import { useOptionalPageContext } from './usePageContext'

export function useT(): TFunction {
  const pageContext = useOptionalPageContext()
  const locale: Locale = pageContext?.locale ?? DEFAULT_LOCALE
  const translations: WebTranslations =
    (pageContext?.translations as WebTranslations | undefined) ?? EN_TRANSLATIONS

  // `getT` memoizes per (translations, locale), so the whole tree shares
  // one accessor rather than allocating one per component instance.
  return getT(translations, locale)
}
