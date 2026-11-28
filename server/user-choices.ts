/**
 * The second half of a `user-choices` block's resolve: the featured moods it
 * offers, and the meditation each opens for a time of day.
 *
 * The choices themselves are read at the page's locale, because their titles
 * are localized. Their meditations are a separate read, by id, at
 * `locale: 'all'` — `server/sahajcloud/meditations.ts` owns it and says why
 * that is the only spelling that answers.
 */

import { asText, type ResolvedMood } from '@/lib/content/blocks'
import type { UserChoice } from '@/types/payload/payload-types'
import { ALL_TIMES_OF_DAY, type TimeOfDay } from '@/lib/time-of-day'
import { documentHref, refId, type RelationValue } from '@/lib/urls/document-routes'
import { cssUrl } from '@/lib/urls/urls'
import { warnOnce } from './error-utils'
import { getPublishedMeditationIds } from './sahajcloud'

const WARN_SOURCE = 'resolveUserChoices'

/**
 * The choice field holding each slot's meditation.
 *
 * `keyof UserChoice` is what fails the build on an upstream rename: a field
 * name that no longer exists reads as "no meditation for this slot" and drops
 * the tile with nothing to show why.
 */
export const SLOT_FIELDS = {
  morning: 'morningMeditation',
  afternoon: 'afternoonMeditation',
  evening: 'eveningMeditation',
} as const satisfies Record<TimeOfDay, keyof UserChoice>

/**
 * A colour the tile may paint. An editor's field is free text upstream, and a
 * non-hex value would reach `background-color` unparsed.
 */
const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/** A mood, and the slot meditations it names, before they are known to exist. */
type Candidate = Omit<ResolvedMood, 'slots'> & {
  refs: Partial<Record<TimeOfDay, string>>
}

/**
 * The featured moods a block offers, each with the meditation it opens per time
 * of day.
 *
 * Takes the block's own already-read choice documents, so the endpoint stays
 * `fetchContentIndexDocs`' business and this owns only the second read.
 *
 * The block can be configured for more than the site renders — a goal, a
 * duration, the non-featured moods — so anything that is not a featured mood is
 * dropped and reported. So is a slot whose meditation is unpublished or gone,
 * and a mood left with no slot at all. Never a dead link.
 */
export async function moodsFromChoices(docs: Record<string, unknown>[]): Promise<ResolvedMood[]> {
  const candidates = docs.flatMap(toCandidate)
  const ids = [...new Set(candidates.flatMap(({ refs }) => Object.values(refs)))]
  const published = await getPublishedMeditationIds(ids)

  // The read reports its own failure. An empty set here would instead drop
  // every tile and report once per mood, for one outage.
  if (published === null) return []

  return candidates.flatMap(({ refs, ...mood }) => {
    const slots = publishedSlots(mood, refs, published)

    return Object.keys(slots).length === 0 ? [] : [{ ...mood, slots }]
  })
}

/** One candidate per featured mood, with every slot reference it carries. */
function toCandidate(doc: Record<string, unknown>): Candidate[] {
  const type = asText(doc.type)
  const isFeatured = doc.isFeatured === true

  if (type !== 'mood' || !isFeatured) {
    warnOnce(
      `unsupported:${type || 'unknown'}:${isFeatured}`,
      'a user-choices block offers a choice the picker does not render',
      { source: WARN_SOURCE, extra: { choiceId: doc.id ?? null, type: type || null, isFeatured } },
    )

    return []
  }
  const refs: Partial<Record<TimeOfDay, string>> = {}

  for (const slot of ALL_TIMES_OF_DAY) {
    const ref = refId(doc[SLOT_FIELDS[slot]] as RelationValue | null | undefined)

    if (ref !== null && ref !== '') refs[slot] = ref
  }
  const id = String(doc.id ?? '')
  const title = asText(doc.title)
  const color = asText(doc.color)
  const url = asText(doc.url)
  // The tile draws the icon inside a CSS `url("…")`, which `cssUrl` gates. A
  // refused one drops the icon and keeps the tile — and is worth reporting,
  // because the one that happens by accident is an upload whose delivery host
  // is unset, which leaves every circle empty with nothing else to show it.
  const iconUrl = url === '' ? null : cssUrl(url)

  if (url !== '' && iconUrl === null) {
    warnOnce(`icon:${id}`, 'a mood icon is not a URL the tile can draw', {
      source: WARN_SOURCE,
      extra: { choiceId: id, choiceTitle: title },
    })
  }

  if (Object.keys(refs).length === 0) {
    // The editor mistake that empties the whole picker, so it must not be the
    // one that reports nothing: a featured mood with no `timings` filled names
    // no meditation at any hour.
    warnOnce(`no-slot:${id}`, 'a featured mood names no meditation for any time of day', {
      source: WARN_SOURCE,
      extra: { choiceId: id, choiceTitle: title },
    })
  }

  return [{ id, title, color: HEX_COLOR.test(color) ? color : null, iconUrl, refs }]
}

/**
 * The slots whose meditation is published, reported one by one.
 *
 * A dropped slot names the mood and the slot, so an engineer can tell the
 * editor who can close the gap which mood it is.
 */
function publishedSlots(
  mood: Omit<ResolvedMood, 'slots'>,
  refs: Partial<Record<TimeOfDay, string>>,
  published: Set<string>,
): Partial<Record<TimeOfDay, string>> {
  const slots: Partial<Record<TimeOfDay, string>> = {}

  for (const slot of ALL_TIMES_OF_DAY) {
    const ref = refs[slot]

    if (ref === undefined) continue

    if (!published.has(ref)) {
      warnOnce(
        `meditation:${mood.id}:${slot}`,
        'a mood names a meditation the picker cannot open',
        {
          source: WARN_SOURCE,
          extra: { choiceId: mood.id, choiceTitle: mood.title, slot, meditationId: ref },
        },
      )
      continue
    }
    const href = documentHref('meditations', { id: ref })

    if (href !== null) slots[slot] = href
  }

  return slots
}
