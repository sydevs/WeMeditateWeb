/**
 * What a mood tile is called, and what makes it unique.
 *
 * Two surfaces render the same fourteen moods — the finder and `/meditations`
 * — and a visitor can compare them side by side, so neither spells the name
 * itself.
 */

import type { MoodCard } from '../../../lib/content-blocks'
import type { TFunction } from '../../../lib/i18n'

/**
 * The feeling a meditation is for and how long it runs, as one parameterised
 * key. Never a sentence built from a visible label: only English builds one
 * that way (`AGENTS.md`).
 */
export function moodCardLabel(t: TFunction, mood: MoodCard): string {
  return t('meditation.general.mood_meditation_label', {
    mood: mood.moodTitle,
    count: mood.durationMinutes,
  })
}

/** A mood may name a different meditation per slot, so the id alone is not a key. */
export function moodCardKey(mood: MoodCard): string {
  return `${mood.moodId}-${mood.href}`
}
