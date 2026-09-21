/**
 * The component-side readers of `pageContext`: the guarded accessor, and the
 * two values a component reads often enough to deserve a name.
 *
 * `usePageContext()` throws outside a Vike app, and Ladle and the unit suite
 * both render components bare. So every reader here falls back rather than
 * throwing: to the default locale, and — where no default could be honest
 * about which site we are — to `null`.
 */

import { usePageContext } from 'vike-react/usePageContext'
import type { PageContext } from 'vike/types'
import { DEFAULT_LOCALE, type Locale } from '../server/cms-types'

/** `pageContext`, or `null` where there is none. */
export function useOptionalPageContext(): PageContext | null {
  try {
    return usePageContext()
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
