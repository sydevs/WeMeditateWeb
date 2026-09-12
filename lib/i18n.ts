/**
 * The translation accessor.
 *
 * Every UI string the site renders comes from the CMS `wm-web-translations`
 * global, threaded through `pageContext.translations`. This module turns
 * that object into `t('tab.sub.key', params)`.
 *
 * English is not special here. It is the CMS `en` locale, mirrored into
 * `lib/translations.en.json` by `pnpm sync:translations` for tests, Ladle,
 * and the CMS-unreachable last resort.
 *
 * `interpolate` and `pluralize` mirror SahajCloud's
 * `src/lib/translations/emailStrings.ts:91-125`, so a string renders the
 * same in an email and on the site.
 */

import type { ReactNode } from 'react'
import type { Locale, WebTranslations } from '../server/cms-types'
import snapshot from './translations.en.json'

/**
 * The committed English snapshot, used when the CMS read fails and as the
 * fixture for tests and Ladle. Generated — see `scripts/sync-translations.mjs`.
 */
export const EN_TRANSLATIONS = snapshot as unknown as WebTranslations

/** CLDR plural categories, in the order the CMS stores them. */
const PLURAL_SUFFIXES = ['one', 'few', 'many', 'other'] as const

type PluralSuffix = (typeof PLURAL_SUFFIXES)[number]

/** Values substituted into a string's `%{name}` placeholders. */
export type TranslationParams = Record<string, string | number>

/**
 * `Intl.PluralRules` per locale.
 *
 * An `Intl` constructor is among the most expensive calls in a Worker
 * isolate, and a plural key can render once per card in a grid. The rules
 * depend only on the locale, so one instance serves the whole request.
 */
const PLURAL_RULES = new Map<string, Intl.PluralRules>()

function pluralRules(locale: string): Intl.PluralRules {
  const existing = PLURAL_RULES.get(locale)
  if (existing) return existing

  const rules = new Intl.PluralRules(locale)
  PLURAL_RULES.set(locale, rules)

  return rules
}

/**
 * Replaces every `%{name}` placeholder with its parameter.
 *
 * An unmatched placeholder is left in place rather than blanked, so a
 * missing parameter is visible instead of silently producing a sentence
 * with a hole in it.
 */
export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template

  return template.replace(/%\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  )
}

/**
 * Picks the plural form for `count`, by the locale's own CLDR rules.
 *
 * The CMS stores a plural key expanded into its `_one`/`_few`/`_many`/
 * `_other` family. English populates `_one` and `_other` only, so a locale
 * whose rules select `few` falls back to `other`, then to any populated
 * form, before giving up.
 */
export function pluralize(
  forms: Partial<Record<PluralSuffix, string | undefined>>,
  count: number,
  locale: string,
): string | undefined {
  let category = 'other'

  try {
    category = pluralRules(locale).select(count)
  } catch {
    // An unknown locale tag falls back to the `other` form.
  }

  // The selected category first, then `other`, then anything populated. A
  // category the CMS does not store simply misses and falls through.
  for (const suffix of [category as PluralSuffix, 'other' as const, ...PLURAL_SUFFIXES]) {
    const form = forms[suffix]
    if (typeof form === 'string' && form.length > 0) return form
  }

  return undefined
}

// ============================================================================
// Key paths
// ============================================================================

/**
 * Every addressable key path, derived from the CMS shape.
 *
 * A nested tab contributes `tab.sub.key`, a flat tab (`navigation`,
 * `footer`) contributes `tab.key`. A plural family collapses to its base:
 * `media.general.duration_minutes`, never `…_one`. A key removed upstream
 * becomes a compile error at every call site after `pnpm types:cms`.
 */
export type TranslationKey = {
  [Tab in keyof WebTranslations]: WebTranslations[Tab] extends Record<string, unknown>
    ? {
        [Sub in keyof WebTranslations[Tab]]: WebTranslations[Tab][Sub] extends string | undefined
          ? `${Tab & string}.${StripPlural<Sub & string>}`
          : {
              [
                Key in keyof WebTranslations[Tab][Sub]
              ]: `${Tab & string}.${Sub & string}.${StripPlural<Key & string>}`
            }[keyof WebTranslations[Tab][Sub]]
      }[keyof WebTranslations[Tab]]
    : never
}[keyof WebTranslations]

/** `show_more_items_one` → `show_more_items`; a non-plural key is unchanged. */
type StripPlural<K extends string> = K extends `${infer Base}_${PluralSuffix}` ? Base : K

/** Reads a dotted path out of the translations object. */
function readPath(source: unknown, path: readonly string[]): unknown {
  let node: unknown = source

  for (const segment of path) {
    if (node === null || typeof node !== 'object') return undefined
    node = (node as Record<string, unknown>)[segment]
  }

  return node
}

// ============================================================================
// createT
// ============================================================================

/**
 * Splits a template into alternating text and placeholder-name parts, for
 * `t.rich`. A capturing group makes `String.split` keep the names, so the
 * odd indices are the placeholders.
 */
const RICH_PLACEHOLDER = /%\{(\w+)\}/

export interface TFunction {
  (key: TranslationKey, params?: TranslationParams): string
  /**
   * Renders a string whose placeholders are React nodes, not text — a link
   * inside a sentence, a name in `<em>`. Text around each placeholder stays
   * translatable, and the nodes keep their markup.
   */
  rich: (key: TranslationKey, nodes: Record<string, ReactNode>) => ReactNode[]
}

/**
 * Builds the accessor for one locale's translations.
 *
 * A missing key resolves to its own key path, so a gap is visible in the
 * page instead of rendering as a blank. In development it also warns once
 * per lookup.
 */
export function createT(translations: WebTranslations, locale: Locale): TFunction {
  const lookup = (key: TranslationKey, params?: TranslationParams): string => {
    const path = String(key).split('.')
    const direct = readPath(translations, path)

    if (typeof direct === 'string' && direct.length > 0) {
      return interpolate(direct, params)
    }

    // A plural key is stored expanded. Resolve the family from its parent
    // group when `count` is supplied.
    if (params && typeof params.count === 'number') {
      const parent = readPath(translations, path.slice(0, -1))
      const base = path[path.length - 1]

      if (parent !== null && typeof parent === 'object') {
        const group = parent as Record<string, unknown>
        const forms: Partial<Record<PluralSuffix, string | undefined>> = {}

        for (const suffix of PLURAL_SUFFIXES) {
          const form = group[`${base}_${suffix}`]
          if (typeof form === 'string') forms[suffix] = form
        }

        const picked = pluralize(forms, params.count, locale)
        if (picked) return interpolate(picked, params)
      }
    }

    if (import.meta.env?.DEV) {
      console.warn(`[i18n] missing translation "${key}" for locale "${locale}"`)
    }

    return String(key)
  }

  const t = lookup as TFunction

  t.rich = (key, nodes) =>
    lookup(key)
      // Odd indices are the captured placeholder names; even ones are the
      // literal text between them. A name with no node stays as written, so
      // a missing node is visible rather than a silent gap.
      .split(RICH_PLACEHOLDER)
      .map((part, index) =>
        index % 2 === 0 ? part : part in nodes ? nodes[part] : `%{${part}}`,
      )
      .filter((part) => part !== '')

  return t
}

/**
 * One accessor per (translations, locale) pair.
 *
 * `useT()` is called by more than forty components, and `ContentCard`
 * renders once per card in a grid, so building an accessor per component
 * instance allocated a closure pair per card. The translations object is
 * stable for a request, so the whole tree shares one accessor. The outer
 * map is weak, so a request's entry goes when its translations do.
 */
const ACCESSORS = new WeakMap<WebTranslations, Map<Locale, TFunction>>()

export function getT(translations: WebTranslations, locale: Locale): TFunction {
  let byLocale = ACCESSORS.get(translations)

  if (!byLocale) {
    byLocale = new Map()
    ACCESSORS.set(translations, byLocale)
  }
  const existing = byLocale.get(locale)

  if (existing) return existing

  const t = createT(translations, locale)
  byLocale.set(locale, t)

  return t
}

/** The accessor bound to the committed English snapshot. */
export const enT = getT(EN_TRANSLATIONS, 'en')
