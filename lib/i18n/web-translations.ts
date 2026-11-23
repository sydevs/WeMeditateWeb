/**
 * The SahajCloud UI strings: which tabs are read, and the type they arrive as.
 * `scripts/sync-translations.mjs` reads the same select for the English snapshot.
 */

import type { WmWebTranslation, WmWebTranslationsSelect } from '@/types/payload/payload-types'
import type { A11yStrings } from './a11y/a11y'

/**
 * The SahajCloud UI strings, with every group required.
 *
 * The generated `WmWebTranslation` marks each group optional, because a
 * locale may be saved partially. Every group still arrives, from Payload's
 * own locale fallback: `buildPayloadLocales` gives each non-English locale
 * `fallbackLocale: 'en'`, so a tab nobody has translated reads as English.
 * SahajCloud #705 fills a blank or missing key from English on every
 * API-client read, but only inside a group the document already carries.
 * Individual keys stay optional: a key added to the schema but not yet
 * translated anywhere is still absent, and `createT` resolves it to its
 * key path.
 */
type RequiredGroups<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends string
    ? string | undefined
    : RequiredGroups<NonNullable<T[K]>>
}

/**
 * Every translations tab the site renders. Typed against the generated
 * select interface, so a tab renamed upstream is a compile error here
 * rather than a silent group of missing strings. `WebTranslations` derives
 * from it, so the query and the type cannot disagree.
 */
export const WEB_TRANSLATIONS_SELECT = {
  common: true,
  navigation: true,
  footer: true,
  errors: true,
  discover: true,
  article: true,
  meditation: true,
  lecture: true,
  map: true,
  forms: true,
  media: true,
  location: true,
  blocks: true,
} satisfies WmWebTranslationsSelect<true>

/** What the `wm-web-translations` read returns. */
export type SahajCloudWebTranslations = RequiredGroups<
  Pick<WmWebTranslation, keyof typeof WEB_TRANSLATIONS_SELECT>
>

/**
 * Every string the site renders: SahajCloud's tabs, each with its `a11y` group
 * mounted from `lib/i18n/a11y/` (`withA11y`).
 */
export type WebTranslations = {
  [Tab in keyof SahajCloudWebTranslations]: SahajCloudWebTranslations[Tab] &
    (Tab extends keyof A11yStrings ? { a11y: A11yStrings[Tab] } : unknown)
}
