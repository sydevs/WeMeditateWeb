/**
 * The component-side readers of `pageContext`: the guarded accessor, and the
 * two values a component reads often enough to deserve a name.
 *
 * Ladle and the unit suite both render components bare, with no Vike
 * provider. `usePageContext()` is declared `PageContext` but returns
 * `undefined` there, so a direct caller gets a value the type checker swears
 * is populated. That is what this module is for: each reader states the
 * absent case and falls back to the default locale, or — where no default
 * could be honest about which site we are — to `null`.
 */

import { usePageContext } from 'vike-react/usePageContext'
import type { PageContext } from 'vike/types'
import { DEFAULT_LOCALE, type Locale } from '../server/sahajcloud-types'

/** `pageContext`, or `null` where there is none. */
export function useOptionalPageContext(): PageContext | null {
  // vike-react 0.6.26 returns `undefined` off-provider rather than throwing.
  // The `catch` is what keeps Ladle and the suite alive if that changes.
  try {
    return usePageContext() ?? null
  } catch {
    return null
  }
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
