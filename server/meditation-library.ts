/**
 * The second half of a `meditations` block's resolve: the meditations its
 * choices name, read by id, and the library shape the organism renders.
 *
 * ⚠ **The meditations are read at `locale=all`, and never at a single locale.**
 * `filterMeditationsByLocale` filters every `find`, so
 * `GET /api/meditations?locale=fr&where[id][in]=…` answers `totalDocs: 0` and the
 * block renders empty in every non-English locale (confirmed in production:
 * `fr` → 0, `all` → every id). `locale=en` would answer, but it drops a
 * localized slot meditation — a French choice may name a French meditation —
 * so `all` is the only spelling that serves both.
 */

import {
  asText,
  choiceMeditationIds,
  claimedSlots,
  meditationChoice,
  meditationDurationMinutes,
  populatedImage,
  type MeditationChoice,
  type MeditationListing,
  type ResolvedMeditationLibrary,
} from '@/lib/content/blocks'
import { documentHref } from '@/lib/urls/document-routes'
import { warnOnce, withRetry } from './error-utils'
import { sahajCloudFetch } from './sahajcloud/fetch'

const WARN_SOURCE = 'resolveMeditationLibrary'

/**
 * `thumbnail` needs `populate[images][filename]` as well as `url`: an upload's
 * `url` is a virtual field the afterRead hook derives from `filename`, so a
 * url-only populate returns null.
 */
const MEDITATION_QUERY = [
  'select[durationMinutes]=true',
  'select[duration]=true',
  'select[thumbnail]=true',
  // A draft does come back from a `find` on this client contract — see the same
  // check at `server/sahajcloud/client.ts`. Without this it renders as a live card.
  'select[_status]=true',
  'populate[images][url]=true',
  'populate[images][filename]=true',
  'populate[images][width]=true',
  'populate[images][height]=true',
].join('&')

interface MeditationDoc {
  id?: number | string
  durationMinutes?: number | null
  duration?: number | null
  thumbnail?: unknown
  _status?: unknown
}

/**
 * The meditations a block's choices name, in one read rather than one
 * `findByID` each: on the SSR path that is up to sixteen requests saved.
 */
async function readMeditations(ids: (number | string)[]): Promise<Map<string, MeditationDoc>> {
  if (ids.length === 0) return new Map()

  const path = `/api/meditations?locale=all&where[id][in]=${ids.join(',')}&limit=${ids.length}&depth=1&${MEDITATION_QUERY}`
  const json = await withRetry(() =>
    sahajCloudFetch<{ docs?: MeditationDoc[] }>(path, 'readMeditations(library)'),
  )

  return new Map((json.docs ?? []).map((doc) => [String(doc.id), doc]))
}

/** Reports a slot a choice claims through `timings` but has left empty. */
function warnEmptyClaimedSlots(doc: Record<string, unknown>, choice: MeditationChoice): void {
  for (const slot of claimedSlots(doc)) {
    if (choice.slots[slot] !== undefined) continue

    warnOnce(
      `empty-slot:${choice.id}:${slot}`,
      'a meditation choice claims a slot it has not filled',
      {
        source: WARN_SOURCE,
        extra: { choiceId: choice.id, choiceTitle: choice.title, kind: choice.kind, slot },
      },
    )
  }
}

/**
 * The choices a `meditations` block offers, and the meditations they name.
 *
 * Takes the block's own already-read choice documents, so the endpoint stays
 * `fetchContentIndexDocs`' business and this owns only the second read.
 *
 * A choice the library cannot render is dropped and reported: a `goal` choice,
 * because the organism asks two questions and a third row would have no
 * question; and a slot whose meditation is missing, unpublished or has no
 * length, because every card label names the meditation by its length. Never a
 * dead link.
 */
export async function meditationLibraryFromChoices(
  docs: Record<string, unknown>[],
  options: { totalDocs?: number } = {},
): Promise<ResolvedMeditationLibrary> {
  const { totalDocs } = options

  if (typeof totalDocs === 'number' && totalDocs > docs.length) {
    warnOnce('capped', 'a meditations block shows fewer choices than the data holds', {
      source: WARN_SOURCE,
      extra: { returned: docs.length, totalDocs },
    })
  }
  const choices: MeditationChoice[] = []

  for (const doc of docs) {
    const choice = meditationChoice(doc)

    if (!choice) {
      warnOnce(
        `unrenderable:${asText(doc.type) || 'unknown'}`,
        'a meditations block offers a choice the library cannot render',
        {
          source: WARN_SOURCE,
          extra: {
            choiceId: typeof doc.id === 'number' ? doc.id : null,
            type: asText(doc.type) || null,
          },
        },
      )
      continue
    }
    warnEmptyClaimedSlots(doc, choice)
    choices.push(choice)
  }

  // `data()` awaits this with no catch of its own, so the read degrades here
  // rather than throwing the whole page away. An empty library renders the
  // organism's unavailable line.
  let meditations: Map<string, MeditationDoc>

  try {
    meditations = await readMeditations(choiceMeditationIds(choices))
  } catch (error) {
    warnOnce('meditations-read', 'a meditations block could not read its meditations', {
      source: WARN_SOURCE,
      extra: { error: error instanceof Error ? error.message : String(error) },
    })

    return { choices: [], meditations: [] }
  }

  return { choices, meditations: listings(choices, meditations) }
}

/**
 * One listing per meditation, carrying every choice that names it, with each
 * dropped slot taken off its own choice so no tile links nowhere.
 *
 * The choice array is mutated in place: a slot whose meditation did not survive
 * is deleted, which is what keeps the server's tile rows and the grid agreeing.
 */
function listings(
  choices: MeditationChoice[],
  meditations: Map<string, MeditationDoc>,
): MeditationListing[] {
  const byId = new Map<string, MeditationListing>()

  for (const choice of choices) {
    for (const slot of Object.keys(choice.slots) as (keyof MeditationChoice['slots'])[]) {
      const ref = choice.slots[slot]

      if (ref === undefined) continue
      const existing = byId.get(String(ref))

      if (existing) {
        if (!existing.choiceIds.includes(choice.id)) {
          existing.choiceIds.push(choice.id)
        }
        continue
      }
      const found = meditations.get(String(ref))
      const doc = asText(found?._status) === 'draft' ? undefined : found
      const href = doc?.id === undefined ? null : documentHref('meditations', { id: doc.id })
      const minutes = doc ? meditationDurationMinutes(doc) : undefined

      if (!doc || !href || minutes === undefined) {
        warnOnce(
          `meditation:${choice.id}:${slot}`,
          'a meditation choice names a meditation the library cannot render',
          {
            source: WARN_SOURCE,
            extra: {
              choiceId: choice.id,
              choiceTitle: choice.title,
              slot,
              meditationId: ref,
              status: asText(found?._status) || null,
              durationMinutes: minutes ?? null,
            },
          },
        )
        delete choice.slots[slot]
        continue
      }

      byId.set(String(ref), {
        id: doc.id as number | string,
        href,
        durationMinutes: minutes,
        thumbnail: populatedImage(doc.thumbnail),
        choiceIds: [choice.id],
      })
    }
  }

  return [...byId.values()]
}
