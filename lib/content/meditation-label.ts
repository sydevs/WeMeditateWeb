/**
 * What one meditation of a `meditations` block is called.
 *
 * `Meditations.title` is a virtual, read-only English fallback — eight distinct
 * values across the fourteen featured rows, two of them identical — so the site
 * never renders it. It names a meditation by the choice that offers it and how
 * long it runs, as one parameterised key, never a sentence assembled from a
 * visible label (`AGENTS.md`).
 *
 * It lives here rather than in the organism because the page head names the
 * same meditations in its `ItemList`, and a visitor can compare the two.
 */

import type { MeditationChoice, MeditationListing } from './blocks'
import type { TFunction } from '@/lib/i18n/i18n'

/**
 * A mood's name where a mood offers it, else its length alone.
 *
 * A meditation several choices name takes the first mood among them, in the
 * order the editor picked: a card carries one label, and the chip row is what
 * shows the rest.
 */
export function meditationLabel(
  t: TFunction,
  listing: MeditationListing,
  choicesById: Map<number, MeditationChoice>,
): string {
  const mood = listing.choiceIds
    .map((id) => choicesById.get(id))
    .find((choice) => choice?.kind === 'mood')

  return mood
    ? t('meditation.general.mood_meditation_label', {
        mood: mood.title,
        count: listing.durationMinutes,
      })
    : t('meditation.general.length_meditation_label', { count: listing.durationMinutes })
}

/** The choices by id, for the label and the chip row to look one up. */
export function choiceIndex(choices: readonly MeditationChoice[]): Map<number, MeditationChoice> {
  return new Map(choices.map((choice) => [choice.id, choice]))
}
