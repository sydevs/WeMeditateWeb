/**
 * `useT`, the component-side translation accessor.
 *
 * `pages/+onBeforeRender.ts` fills `translations` from SahajCloud and
 * `passToClient` carries them into the browser. Outside a Vike app — Ladle, a
 * unit test rendering a component bare — there is none, so this falls back to
 * the committed English snapshot.
 *
 * The other `pageContext` readers live in `hooks/usePageContext.ts`.
 */

import { DEFAULT_LOCALE, type Locale, type WebTranslations } from '../server/sahajcloud-types'
import { EN_TRANSLATIONS, getT, type TFunction } from '../lib/i18n'
import { useOptionalPageContext } from './usePageContext'

export function useT(): TFunction {
  return pageContextT(useOptionalPageContext())
}

/**
 * The same accessor, off a `pageContext` held directly.
 *
 * `pages/+config.ts` composes the `<title>` and the description from a
 * plain function, where no hook may be called.
 */
export function pageContextT(
  pageContext: { locale?: Locale; translations?: unknown } | null | undefined,
): TFunction {
  const locale: Locale = pageContext?.locale ?? DEFAULT_LOCALE
  const translations: WebTranslations =
    (pageContext?.translations as WebTranslations | undefined) ?? EN_TRANSLATIONS

  // `getT` memoizes per (translations, locale), so the whole tree shares
  // one accessor rather than allocating one per component instance.
  return getT(translations, locale)
}
