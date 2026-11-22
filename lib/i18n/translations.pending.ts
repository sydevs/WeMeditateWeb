/**
 * English for keys SahajCloud declares but has not merged.
 *
 * `lib/i18n/translations.en.json` is a copied contract: `pnpm sync:translations`
 * rewrites it from production's English locale, and the contract check fails
 * any PR that changes it to something that read does not produce. Overlaying
 * here puts these strings in `EN_TRANSLATIONS` — `useT()`'s fallback, and the
 * fixture for tests and Ladle — while the copy stays byte-identical to its
 * source. `types/sahajcloud.ts` declares the matching types for the
 * same reason.
 *
 * The overlay lives beside the strings so removing it is one import and one
 * call in `lib/i18n/i18n.ts`.
 *
 * shortcut: declared by sydevs/SahajCloud#1225, so delete this module once
 * `pnpm sync:translations` carries these keys.
 */

/** Groups keyed by name, each a flat group of strings. */
type TranslationGroups = Record<string, Record<string, unknown>>

const PENDING_EN: TranslationGroups = {
  meditation: {
    a11y: {
      finder_region: 'Choose how you feel',
    },
    general: {
      all_meditations: 'All meditations',
      finder_question: 'How are you feeling?',
      finder_unavailable: "We can't load the meditations just now. Please try again shortly.",
      mood_meditation_label_one: '%{mood} · %{count} min',
      mood_meditation_label_other: '%{mood} · %{count} min',
    },
  },
}

/**
 * The snapshot with the pending English merged in.
 *
 * A key already in the snapshot wins, so the overlay goes stale rather than
 * shadowing a word an editor has since typed upstream.
 */
export function withPendingEnglish<T extends TranslationGroups>(snapshot: T): T {
  const merged: TranslationGroups = { ...snapshot }

  for (const [tab, groups] of Object.entries(PENDING_EN)) {
    const existingTab = (merged[tab] ?? {}) as TranslationGroups
    const mergedTab: TranslationGroups = { ...existingTab }

    for (const [group, strings] of Object.entries(groups)) {
      mergedTab[group] = { ...(strings as Record<string, unknown>), ...existingTab[group] }
    }

    merged[tab] = mergedTab
  }

  return merged as T
}
