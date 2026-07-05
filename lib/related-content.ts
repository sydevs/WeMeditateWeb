/**
 * Map the shaped related-content endpoint cards (SahajCloud #523) to the shared
 * `ResolvedCardItem` grid shape rendered by `RelatedContent` / `ContentGrid`.
 *
 * The endpoints already shape and filter their docs server-side (dropping any
 * card missing a public title / duration / thumbnail), and the cms-client
 * fetchers guard the rendered fields again — so these mappers are pure shape
 * translation with no further filtering.
 *
 * Both card types use `aspectRatio: 'video'`: meditation thumbnails are ~16:9
 * (`imagedelivery.net/.../public`) and lecture thumbnails are YouTube
 * `mqdefault` (320×180, exactly 16:9).
 */

import type { RelatedMeditationCard, RelatedLectureCard } from '../server/cms-types'
import type { ResolvedCardItem } from './cms-blocks'

/** Minutes badge from a length in seconds: rounded, omitted below 1 minute (a
 * "0 min" badge is meaningless). Mirrors `meditationDurationMinutes` in
 * cms-blocks.ts so lecture and meditation cards read consistently. */
function minutesFromSeconds(seconds: number): number | undefined {
  const minutes = seconds > 0 ? Math.round(seconds / 60) : 0

  return minutes >= 1 ? minutes : undefined
}

/** Map related meditations (from a lecture) to grid cards linking to the full
 * meditation route. */
export function relatedMeditationsToCards(cards: RelatedMeditationCard[]): ResolvedCardItem[] {
  return cards.map((card) => ({
    id: card.id,
    title: card.title,
    href: `/meditations/${card.id}`,
    thumbnailSrc: card.thumbnailUrl,
    thumbnailAlt: card.title,
    aspectRatio: 'video',
    playButton: true,
    durationMinutes: card.durationMinutes >= 1 ? card.durationMinutes : undefined,
  }))
}

/** Map related lectures (from a meditation) to grid cards linking to the full
 * lecture route. `durationSeconds` is the playable clip/lecture length. */
export function relatedLecturesToCards(cards: RelatedLectureCard[]): ResolvedCardItem[] {
  return cards.map((card) => ({
    id: card.id,
    title: card.title,
    href: `/lectures/${card.id}`,
    thumbnailSrc: card.thumbnailUrl,
    thumbnailAlt: card.title,
    aspectRatio: 'video',
    playButton: true,
    durationMinutes: minutesFromSeconds(card.durationSeconds),
  }))
}
