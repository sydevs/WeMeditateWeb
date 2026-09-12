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
const ENDONYMS = new Map<Locale, string>()

export function localeEndonym(locale: Locale): string {
  // The site chrome maps this over every offered locale on every page, and
  // each flag calls it again. An endonym is a constant for its locale, and
  // `Intl.DisplayNames` is expensive to construct, so cache the result.
  const cached = ENDONYMS.get(locale)
  if (cached) return cached

  let name: string | undefined

  try {
    name = new Intl.DisplayNames([locale], { type: 'language' }).of(locale)
  } catch {
    name = undefined
  }

  const endonym = name ? name.charAt(0).toLocaleUpperCase(locale) + name.slice(1) : locale

  ENDONYMS.set(locale, endonym)

  return endonym
}

/** `Intl.ListFormat` per locale, for the same reason. */
const LIST_FORMATS = new Map<string, Intl.ListFormat>()

/**
 * Joins a list the way the locale joins one — a comma is not universal,
 * and the final conjunction differs by language.
 */
export function formatList(items: string[], locale: Locale): string {
  let formatter = LIST_FORMATS.get(locale)

  if (!formatter) {
    formatter = new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' })
    LIST_FORMATS.set(locale, formatter)
  }

  return formatter.format(items)
}
