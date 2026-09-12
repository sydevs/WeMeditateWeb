/**
 * Language names, from the platform rather than the CMS.
 *
 * A language's own name for itself — its endonym — is not a translated
 * string: "Deutsch" is Deutsch in every UI language. `Intl.DisplayNames`
 * knows them all, so these never became CMS keys (SahajCloud #707,
 * "Excluded").
 */

import type { Locale } from '../server/cms-types'

/**
 * The language's name in itself, capitalised by its own rules.
 *
 * `Intl.DisplayNames` returns a lower-case name in most languages
 * ("français", "italiano"). The picker reads better capitalised, and
 * `toLocaleUpperCase(locale)` does that with the locale's own casing rules
 * — Turkish `i` uppercases to `İ`, not `I`.
 *
 * Falls back to the raw code if the runtime has no name for it, which is
 * still a usable picker entry.
 */
export function localeEndonym(locale: Locale): string {
  let name: string | undefined

  try {
    name = new Intl.DisplayNames([locale], { type: 'language' }).of(locale)
  } catch {
    name = undefined
  }

  if (!name) return locale

  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1)
}
