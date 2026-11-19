/**
 * The mood finder's data: the featured moods for a time of day, each resolved
 * to the one meditation it names for that time.
 *
 * Two reads, deliberately at different locales.
 *
 * The moods carry `title`, which is localized upstream, so that read takes the
 * page's locale and an untranslated mood falls back to English.
 *
 * The meditations are read at `locale=en` whatever the page's locale.
 * `GET /api/meditations?locale=fr` answers `totalDocs: 0` — every `find` is
 * filtered by locale and all 121 rows are `locale: en` — so a *populated* read
 * at the page's locale hands back a bare id in every slot and the region
 * renders empty on a 200 page in all nine non-English locales. Nothing
 * localized is lost by reading them in English: the site composes the label
 * itself, because `Meditations.title` is a virtual English fallback with eight
 * distinct values across these fourteen rows.
 */

import {
  asText,
  meditationDurationMinutes,
  populatedImage,
  type MoodCard,
} from '../lib/content-blocks'
import { documentHref } from '../lib/document-routes'
import { timeOfDaySlot, type TimeOfDay } from '../lib/time-of-day'
import { withRetry } from './error-utils'
import { createWarnOnce } from './warn-once'
import { sahajCloudFetch } from './sahajcloud-fetch'
import { tryGetContext } from './sahajcloud-context'
import type { Locale } from './sahajcloud-types'

/** Every slot the site offers, in the order a day runs. */
const ALL_SLOTS: TimeOfDay[] = ['morning', 'afternoon', 'evening']

/** The field a mood names its meditation for one time of day in. */
const slotField = (slot: TimeOfDay) => `${slot}Meditation` as const

/**
 * The featured-mood filter, and the only place the site spells it.
 *
 * It is the same filter the `content-index` block computes upstream, but the
 * site reads it here for both surfaces rather than following the block's
 * `apiEndpoint`: `/meditations` carries no block at all, and a second spelling
 * is one only the block path would keep in step.
 */
const FEATURED_MOODS_ENDPOINT =
  '/api/user-choices?where[isFeatured][equals]=true&where[type][equals]=mood'

const MOOD_SELECT = [
  'select[title]=true',
  'select[timings]=true',
  'select[color]=true',
  // `url` is a virtual upload field and returns null without `filename`.
  'select[url]=true',
  'select[filename]=true',
  'select[morningMeditation]=true',
  'select[afternoonMeditation]=true',
  'select[eveningMeditation]=true',
].join('&')

const MEDITATION_QUERY = [
  'select[durationMinutes]=true',
  'select[duration]=true',
  'select[thumbnail]=true',
  'populate[images][url]=true',
  'populate[images][filename]=true',
  'populate[images][width]=true',
  'populate[images][height]=true',
].join('&')

/** A mood document, as the read above returns it. */
interface MoodDoc {
  id?: number
  title?: unknown
  timings?: unknown
  color?: unknown
  url?: unknown
  morningMeditation?: unknown
  afternoonMeditation?: unknown
  eveningMeditation?: unknown
}

/**
 * Every warning this module sends. Each is on the SSR hot path and nothing
 * caches these reads, so all of them are bounded, not only the data gaps.
 */
const warnOnce = createWarnOnce('featuredMoodCards')

/**
 * The visitor's own time of day, resolved from Cloudflare's `cf.timezone`.
 *
 * ⚠ Call this inside `data()`. `+onBeforeRoute` also runs in the browser,
 * where there is no request to read. No page response sets `Cache-Control`
 * today, so a per-visitor render is correct; never resolve the slot behind a
 * shared cacheable route.
 *
 * An absent or unusable zone resolves to `evening`, the slot with the most
 * moods, rather than to nothing.
 */
export function visitorTimeOfDay(now: Date = new Date()): TimeOfDay {
  // `cf` is untyped in this repo and this is its only reader, so it is narrowed
  // here rather than widened globally for one field. Outside a request (Ladle,
  // a unit render) there is no context, and `tryGetContext` answers undefined.
  const raw = tryGetContext()?.req.raw as { cf?: { timezone?: unknown } } | undefined
  const value = raw?.cf?.timezone
  const timezone = typeof value === 'string' ? value : undefined
  const slot = timeOfDaySlot(timezone, now)

  if (slot === null) {
    warnOnce(`timezone:${timezone ?? 'absent'}`, 'mood finder could not read the visitor timezone', {
      timezone: timezone ?? null,
    })

    return 'evening'
  }

  return slot
}

/**
 * The times of day a mood offers, narrowed to `slot` when one is given.
 *
 * Read off `timings`, never off which slot fields happen to be filled: a mood
 * that names a time of day owes it a meditation, and a slot it names but has
 * not filled is the gap the caller reports. Reading the fields instead would
 * list one meditation twice for a mood holding it in two slots, and would make
 * the commonest gap unreportable, because there would be nothing to report on.
 */
function moodSlots(doc: MoodDoc, slot?: TimeOfDay): TimeOfDay[] {
  const named = Array.isArray(doc.timings) ? doc.timings : []

  return (slot ? [slot] : ALL_SLOTS).filter((candidate) => named.includes(candidate))
}

interface MeditationDoc {
  id?: number | string
  durationMinutes?: number | null
  duration?: number | null
  thumbnail?: unknown
}

/**
 * The meditations behind a set of moods, by id, in one read at `locale=en`.
 *
 * One round trip rather than one `findByID` per mood: on the SSR path that is
 * five requests saved on an evening render.
 */
async function readMeditations(ids: (number | string)[]): Promise<Map<string, MeditationDoc>> {
  if (ids.length === 0) return new Map()

  const path = `/api/meditations?locale=en&where[id][in]=${ids.join(',')}&limit=${ids.length}&depth=1&${MEDITATION_QUERY}`
  const json = await withRetry(() =>
    sahajCloudFetch<{ docs?: MeditationDoc[] }>(path, 'readMeditations(moods)'),
  )

  return new Map((json.docs ?? []).map((doc) => [String(doc.id), doc]))
}

function meditationRef(doc: MoodDoc, slot: TimeOfDay): number | string | null {
  const value = doc[slotField(slot)]

  return typeof value === 'number' || typeof value === 'string' ? value : null
}

/**
 * Turns already-read mood documents into tiles.
 *
 * With a `slot`, only the moods offering that time of day; without one, every
 * featured mood's meditation for every slot it names — which is each of the
 * fourteen once, since a mood names exactly one meditation per time of day.
 *
 * ⚠ **`limit` caps the moods shown, after the slot filter, never the read.**
 * The fourteen featured moods are interleaved by `order` upstream, so capping
 * before the filter starves the time of day the visitor is actually in.
 *
 * A mood whose slot meditation does not come back is dropped rather than
 * linked to `/undefined`, and a response short of what the data holds is
 * reported rather than rendered as a silently short list.
 */
async function moodCardsFromDocs(
  docs: MoodDoc[],
  options: { slot?: TimeOfDay; limit?: number; totalDocs?: number } = {},
): Promise<MoodCard[]> {
  const { slot, limit, totalDocs } = options

  if (typeof totalDocs === 'number' && totalDocs > docs.length) {
    warnOnce(`paginated:${slot ?? 'all'}`, 'mood finder read fewer moods than the data holds', {
      slot: slot ?? null,
      returned: docs.length,
      totalDocs,
    })
  }

  const forSlot = docs.filter((doc) => moodSlots(doc, slot).length > 0)
  const capped = typeof limit === 'number' && limit >= 0 ? forSlot.slice(0, limit) : forSlot
  const pairs = capped.flatMap((doc) =>
    moodSlots(doc, slot).map((each): [MoodDoc, TimeOfDay] => [doc, each]),
  )
  // Deduped: two moods may name one meditation, and `limit` is then the exact
  // number of documents the read expects back.
  const ids = [
    ...new Set(
      pairs
        .map(([doc, each]) => meditationRef(doc, each))
        .filter((id): id is number | string => id !== null),
    ),
  ]

  // `data()` awaits this with no catch of its own, so the second read degrades
  // here rather than throwing the whole page away.
  let meditations: Map<string, MeditationDoc>

  try {
    meditations = await readMeditations(ids)
  } catch (error) {
    warnOnce(`meditations-read:${slot ?? 'all'}`, 'mood finder could not read the meditations', {
      slot: slot ?? null,
      error: error instanceof Error ? error.message : String(error),
    })

    return []
  }
  const cards: MoodCard[] = []

  for (const [doc, each] of pairs) {
    const moodId = doc.id
    const moodTitle = asText(doc.title)

    if (typeof moodId !== 'number' || moodTitle.length === 0) continue

    const meditationId = meditationRef(doc, each)
    const meditation = meditationId === null ? undefined : meditations.get(String(meditationId))

    const href = meditation ? documentHref('meditations', { id: meditation.id }) : null
    const minutes = meditation ? meditationDurationMinutes(meditation) : undefined

    // No meditation, no route, or no length: the label names the meditation by
    // its length, so all three leave nothing to render. Never a dead link, and
    // never the "nothing for now" message this goal puts out of scope.
    if (!meditation || !href || minutes === undefined) {
      warnOnce(`meditation:${moodId}:${each}`, 'a featured mood has no meditation for its slot', {
        moodId,
        moodTitle,
        slot: each,
        meditationId,
        durationMinutes: minutes ?? null,
      })
      continue
    }

    cards.push({
      moodId,
      moodTitle,
      iconUrl: asText(doc.url) || null,
      color: asText(doc.color) || null,
      href,
      durationMinutes: minutes,
      thumbnail: populatedImage(meditation.thumbnail),
    })
  }

  return cards
}

/**
 * The featured moods, resolved to tiles. The one entry point: the finder block
 * and `/meditations` both come through here.
 *
 * With a `slot`, the moods that offer that time of day — the finder's set.
 * Without one, every featured mood's meditation — the `/meditations` list.
 * `limit` caps what is shown, never what is read.
 */
export async function featuredMoodCards(options: {
  locale?: Locale
  slot?: TimeOfDay
  limit?: number
}): Promise<MoodCard[]> {
  const { locale, slot, limit } = options
  const localeParam = locale ? `&locale=${locale}` : ''
  // 100 is the API's own ceiling, and there are fourteen featured moods: this
  // read must never be the thing that starves a slot.
  const path = `${FEATURED_MOODS_ENDPOINT}&limit=100&depth=0&${MOOD_SELECT}${localeParam}`

  try {
    const json = await withRetry(() =>
      sahajCloudFetch<{ docs?: MoodDoc[]; totalDocs?: number }>(path, 'featuredMoodCards'),
    )

    return await moodCardsFromDocs(json.docs ?? [], { slot, limit, totalDocs: json.totalDocs })
  } catch (error) {
    warnOnce(`moods-read:${slot ?? 'all'}`, 'featured moods read failed', {
      slot: slot ?? null,
      error: error instanceof Error ? error.message : String(error),
    })

    return []
  }
}
