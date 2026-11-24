/**
 * The second half of a `user-choices` block's resolve: the meditations its
 * moods name, read by id, and the tiles the picker renders.
 *
 * ⚠ **The meditations are read at `locale=all`, and never at a single locale.**
 * `filterMeditationsByLocale` filters every `find`, so
 * `GET /api/meditations?locale=fr&where[id][in]=…` answers `totalDocs: 0` and the
 * picker renders empty in every non-English locale (confirmed in production:
 * `fr` → 0, `all` → every id). `locale=en` would answer, but it drops a
 * localized slot meditation — a French mood may name a French meditation — so
 * `all` is the only spelling that serves both.
 */

import { ALL_TIMES_OF_DAY, type TimeOfDay } from '@/lib/time-of-day'
import type { ResolvedMood } from '@/lib/content/blocks'
import { documentHref } from '@/lib/urls/document-routes'
import { warnOnce, withRetry } from './error-utils'
import { sahajCloudFetch } from './sahajcloud/fetch'

const WARN_SOURCE = 'resolveUserChoices'

/** The choice field holding each slot's meditation. */
const SLOT_FIELDS: Record<TimeOfDay, string> = {
  morning: 'morningMeditation',
  afternoon: 'afternoonMeditation',
  evening: 'eveningMeditation',
}

/**
 * A colour the tile may paint. An editor's field is free text upstream, and a
 * non-hex value would reach `background-color` unparsed.
 */
const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/**
 * `_status` is the whole point of this read: a draft meditation does come back
 * from a `find` on this client contract, so without it a mood would link a
 * visitor to a page that is not published.
 */
const MEDITATION_QUERY = 'select[_status]=true'

interface MeditationDoc {
  id?: number | string
  _status?: unknown
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/** A slot's meditation id, from the bare relationship a `depth=0` read returns. */
function slotRef(doc: Record<string, unknown>, slot: TimeOfDay): string | null {
  const value = doc[SLOT_FIELDS[slot]]

  if (typeof value === 'number' || (typeof value === 'string' && value.length > 0)) {
    return String(value)
  }
  // A populated object, which a future depth change would bring back.
  if (value && typeof value === 'object' && 'id' in value) {
    const { id } = value as { id?: unknown }

    return id === undefined || id === null ? null : String(id)
  }

  return null
}

/**
 * The meditations a block's moods name, in one read rather than one `findByID`
 * each: on the SSR path that is up to fourteen requests saved.
 */
async function readMeditations(ids: string[]): Promise<Map<string, MeditationDoc>> {
  if (ids.length === 0) return new Map()

  const path = `/api/meditations?locale=all&where[id][in]=${ids.join(',')}&limit=${ids.length}&depth=0&${MEDITATION_QUERY}`
  const json = await withRetry(() =>
    sahajCloudFetch<{ docs?: MeditationDoc[] }>(path, 'readMeditations(user-choices)'),
  )

  return new Map((json.docs ?? []).map((doc) => [String(doc.id), doc]))
}

/**
 * The featured moods a `user-choices` block offers, each with the meditation it
 * opens per time of day.
 *
 * Takes the block's own already-read choice documents, so the endpoint stays
 * `fetchContentIndexDocs`' business and this owns only the second read.
 *
 * The block can be configured for more than the site renders — a goal, a
 * duration, the non-featured moods — so anything that is not a featured mood is
 * dropped and reported. So is a slot whose meditation is a draft or gone, and a
 * mood left with no slot at all. Never a dead link.
 */
export async function moodsFromChoices(
  docs: Record<string, unknown>[],
): Promise<{ moods: ResolvedMood[] }> {
  const candidates: { mood: ResolvedMood; refs: Partial<Record<TimeOfDay, string>> }[] = []

  for (const doc of docs) {
    const type = asText(doc.type)
    const isFeatured = doc.isFeatured === true

    if (type !== 'mood' || !isFeatured) {
      warnOnce(
        `unsupported:${type || 'unknown'}:${isFeatured}`,
        'a user-choices block offers a choice the picker does not render',
        {
          source: WARN_SOURCE,
          extra: { choiceId: doc.id ?? null, type: type || null, isFeatured },
        },
      )
      continue
    }
    const refs: Partial<Record<TimeOfDay, string>> = {}

    for (const slot of ALL_TIMES_OF_DAY) {
      const ref = slotRef(doc, slot)

      if (ref !== null) refs[slot] = ref
    }
    const color = asText(doc.color)

    candidates.push({
      mood: {
        id: String(doc.id ?? ''),
        title: asText(doc.title),
        color: HEX_COLOR.test(color) ? color : null,
        iconUrl: asText(doc.url) || null,
        slots: {},
      },
      refs,
    })
  }

  const ids = [...new Set(candidates.flatMap(({ refs }) => Object.values(refs)))]
  let meditations: Map<string, MeditationDoc>

  // `data()` awaits this with no catch of its own, so the read degrades here
  // rather than throwing the whole page away. An empty picker renders nothing.
  try {
    meditations = await readMeditations(ids)
  } catch (error) {
    warnOnce('meditations-read', 'a user-choices block could not read its meditations', {
      source: WARN_SOURCE,
      extra: { error: error instanceof Error ? error.message : String(error) },
    })

    return { moods: [] }
  }

  return { moods: candidates.flatMap((candidate) => fillSlots(candidate, meditations)) }
}

/**
 * One mood with every slot whose meditation is published, or nothing at all
 * where none is. A dropped slot is reported against the mood and the slot, so
 * an engineer can name the gap to the editor who can close it.
 */
function fillSlots(
  { mood, refs }: { mood: ResolvedMood; refs: Partial<Record<TimeOfDay, string>> },
  meditations: Map<string, MeditationDoc>,
): ResolvedMood[] {
  const slots: Partial<Record<TimeOfDay, string>> = {}

  for (const slot of ALL_TIMES_OF_DAY) {
    const ref = refs[slot]

    if (ref === undefined) continue
    const found = meditations.get(ref)
    const status = asText(found?._status)
    const href = found === undefined ? null : documentHref('meditations', { id: ref })

    if (found === undefined || status === 'draft' || href === null) {
      warnOnce(
        `meditation:${mood.id}:${slot}`,
        'a mood names a meditation the picker cannot open',
        {
          source: WARN_SOURCE,
          extra: {
            choiceId: mood.id,
            choiceTitle: mood.title,
            slot,
            meditationId: ref,
            status: status || null,
          },
        },
      )
      continue
    }
    slots[slot] = href
  }

  if (Object.keys(slots).length === 0) return []

  return [{ ...mood, slots }]
}
