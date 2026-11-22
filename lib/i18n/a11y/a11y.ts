/**
 * The screen-reader strings: the one set of UI strings this repo owns.
 *
 * Every string a sighted visitor reads comes from SahajCloud. A string that is
 * only ever spoken — an `aria-label`, an `sr-only` span, a live-region
 * announcement — lives here instead, in `lib/i18n/a11y/<locale>.json`, and is
 * machine-translated by whoever adds it. Translators never see these, and
 * adding one needs no SahajCloud schema change, migration or type sync.
 *
 * Each file holds `<tab>.<key>`, and the strings are mounted at
 * `<tab>.a11y.<key>` on the translations object, so `t('media.a11y.play')`
 * reads one exactly as it reads a SahajCloud string. The rule is the path: a
 * key with an `a11y` segment comes from here, and SahajCloud declares none.
 *
 * This module imports English alone, so it is safe to reach from the browser.
 * The other locales load in `catalog.ts`, on the server only.
 */

import en from './en.json'

/** One locale's screen-reader strings, `<tab>.<key>`, shaped by the English file. */
export type A11yStrings = typeof en

/** A locale's file: the English shape, with a plural family free to hold its own categories. */
export type A11yFile = { [Tab in keyof A11yStrings]?: Record<string, string> }

/** The English strings, and the fallback for any key a locale's file lacks. */
export const EN_A11Y: A11yStrings = en

/**
 * Lays a locale's file over English, key by key.
 *
 * `a11y.test.ts` holds every file complete, so this matters only for a key added
 * without its translations: it is read in English rather than as its own key path.
 */
export function overEnglish(file: A11yFile): A11yStrings {
  const merged: Record<string, Record<string, string>> = {}

  for (const tab of Object.keys(EN_A11Y) as (keyof A11yStrings)[]) {
    merged[tab] = { ...EN_A11Y[tab], ...file[tab] }
  }

  return merged as A11yStrings
}

/**
 * Mounts one locale's strings at `<tab>.a11y` on a translations object. A tab
 * the base lacks gains just its `a11y` group.
 */
export function withA11y<Result>(base: object, strings: A11yStrings): Result {
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) }

  for (const [tab, group] of Object.entries(strings)) {
    const existing = result[tab]
    const host = existing !== null && typeof existing === 'object' ? existing : {}

    result[tab] = { ...host, a11y: group }
  }

  return result as Result
}
