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

import * as Sentry from '@sentry/cloudflare'
import { getContext } from 'hono/context-storage'
import { populatedImage, type MoodCard } from '../lib/content-blocks'
import { documentHref } from '../lib/document-routes'
import { timeOfDaySlot, type TimeOfDay } from '../lib/time-of-day'
import { withRetry } from './error-utils'
import { sahajCloudFetch } from './sahajcloud-fetch'
import type { SahajCloudEnv } from './sahajcloud-context'
import type { Locale } from './sahajcloud-types'

/** The meditation slot a mood names for each time of day. */
const SLOT_FIELD: Record<TimeOfDay, string> = {
  morning: 'morningMeditation',
  afternoon: 'afternoonMeditation',
  evening: 'eveningMeditation',
}

/**
 * The featured-mood filter the `content-index` block computes upstream.
 * `/meditations` has no block, so it spells the same query here.
 */
const FEATURED_MOODS_ENDPOINT =
  '/api/user-choices?where[isFeatured][equals]=true&where[type][equals]=mood'

const MOOD_SELECT = [
  'select[title]=true',
  'select[timings]=true',
  'select[order]=true',
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
  'select[_status]=true',
  'populate[images][url]=true',
  'populate[images][filename]=true',
  'populate[images][width]=true',
  'populate[images][height]=true',
].join('&')

/** A mood document, as the user-choices read above returns it. */
export interface MoodDoc extends Record<string, unknown> {
  id?: unknown
  title?: unknown
  timings?: unknown
  color?: unknown
  url?: unknown
}

/**
 * Bounds the Sentry volume. This runs per render and nothing here caches it,
 * and a gap stands until an editor fixes the data, so one event per distinct
 * gap per isolate is what keeps a warning affordable enough to leave on
 * (`server/AGENTS.md`). Past the cap the set is emptied rather than pruned:
 * re-reporting a live gap is the harmless direction.
 */
const reportedMoodGaps = new Set<string>()
const MAX_REPORTED_MOOD_GAPS = 64

function warnOnce(signature: string, message: string, extra: Record<string, unknown>): void {
  if (reportedMoodGaps.has(signature)) return
  if (reportedMoodGaps.size >= MAX_REPORTED_MOOD_GAPS) reportedMoodGaps.clear()

  reportedMoodGaps.add(signature)
  Sentry.captureMessage(message, { level: 'warning', tags: { source: 'featuredMoodCards' }, extra })
}

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
  let timezone: string | undefined

  try {
    // `cf` is untyped in this repo and this is its only reader, so it is
    // narrowed here rather than widened globally for one field.
    const raw = getContext<SahajCloudEnv>().req.raw as { cf?: { timezone?: unknown } }
    const value = raw.cf?.timezone

    timezone = typeof value === 'string' ? value : undefined
  } catch {
    // Outside a request (Ladle, a unit render) there is no context to read.
    timezone = undefined
  }

  const slot = timeOfDaySlot(timezone, now)

  if (slot === null) {
    warnOnce(`timezone:${timezone ?? 'absent'}`, 'mood finder could not read the visitor timezone', {
      timezone: timezone ?? null,
    })

    return 'evening'
  }

  return slot
}

/** The moods whose `timings` include `slot`, or every mood when none is given. */
export function moodsForSlot(docs: MoodDoc[], slot?: TimeOfDay): MoodDoc[] {
  if (!slot) return docs

  return docs.filter((doc) => Array.isArray(doc.timings) && doc.timings.includes(slot))
}

interface MeditationDoc {
  id?: number | string
  durationMinutes?: number | null
  duration?: number | null
  thumbnail?: unknown
  _status?: unknown
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

/** Minutes for a card: the explicit field, else derived from seconds. */
function durationMinutes(doc: MeditationDoc): number | undefined {
  const minutes =
    typeof doc.durationMinutes === 'number'
      ? doc.durationMinutes
      : typeof doc.duration === 'number' && doc.duration > 0
        ? Math.round(doc.duration / 60)
        : undefined

  return minutes !== undefined && minutes >= 1 ? minutes : undefined
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function meditationRef(doc: MoodDoc, slot: TimeOfDay): number | string | null {
  const value = doc[SLOT_FIELD[slot]]

  return typeof value === 'number' || typeof value === 'string' ? value : null
}

/** The `(mood, slot)` pairs a set of moods offers, in the moods' own order. */
function moodSlotPairs(docs: MoodDoc[], slot?: TimeOfDay): Array<[MoodDoc, TimeOfDay]> {
  const slots: TimeOfDay[] = slot ? [slot] : ['morning', 'afternoon', 'evening']
  const pairs: Array<[MoodDoc, TimeOfDay]> = []

  for (const doc of docs) {
    for (const candidate of slots) {
      if (meditationRef(doc, candidate) !== null) pairs.push([doc, candidate])
    }
  }

  return pairs
}

/**
 * Turns already-read mood documents into tiles.
 *
 * With a `slot`, only the moods offering that time of day; without one, every
 * featured mood's meditation for every slot it names — which is each of the
 * fourteen once, since a mood names exactly one meditation per time of day.
 *
 * ⚠ **`limit` caps the filtered set, not the read.** The editor's number means
 * "how many moods to show", and the fourteen featured moods are interleaved by
 * `order` upstream — so slicing before the slot filter starves the slot. The
 * block's own endpoint carries the server-side cap.
 *
 * A mood whose slot meditation does not come back is dropped rather than
 * linked to `/undefined`, and a response short of what the data holds is
 * reported rather than rendered as a silently short list.
 */
export async function moodCardsFromDocs(
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

  const forSlot = moodsForSlot(docs, slot)
  const capped = typeof limit === 'number' && limit >= 0 ? forSlot.slice(0, limit) : forSlot
  const pairs = moodSlotPairs(capped, slot)
  const meditations = await readMeditations(
    pairs.map(([doc, each]) => meditationRef(doc, each)).filter((id): id is number | string => id !== null),
  )
  const cards: MoodCard[] = []

  for (const [doc, each] of pairs) {
    const moodId = doc.id
    const moodTitle = asString(doc.title)

    if (typeof moodId !== 'number' || moodTitle.length === 0) continue

    const meditationId = meditationRef(doc, each)
    const meditation = meditationId === null ? undefined : meditations.get(String(meditationId))
    const href = meditation ? documentHref('meditations', { id: meditation.id }) : null
    const minutes = meditation ? durationMinutes(meditation) : undefined

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
      iconUrl: asString(doc.url) || null,
      color: asString(doc.color) || null,
      href,
      durationMinutes: minutes,
      thumbnail: populatedImage(meditation.thumbnail),
    })
  }

  return cards
}

/**
 * The featured moods, resolved to tiles.
 *
 * With a `slot`, the moods that offer that time of day — the finder's set.
 * Without one, every featured mood's meditation — the `/meditations` list.
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
    Sentry.captureMessage('featured moods read failed', {
      level: 'warning',
      tags: { source: 'featuredMoodCards' },
      extra: { slot: slot ?? null, error: error instanceof Error ? error.message : String(error) },
    })

    return []
  }
}
