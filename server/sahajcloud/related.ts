/**
 * Reads the related-content cards SahajCloud ranks for a lecture or a meditation.
 */

import { withRetry } from '@/server/error-utils'
import { sahajCloudFetchOptional } from './fetch'
import { degrade } from '@/server/error-utils'
import type { Audience } from '@/types/payload/payload-types'
import type { WebConfig, RelatedMeditationCard, RelatedLectureCard } from '@/types/sahajcloud'
import type { LocalizedQueryOptions } from './query'

/** Extracts audience document IDs (populated object or bare ID) as strings.
 * Shared with the content-index `/for-audience` lecture feed (server/content-index.ts). */
export function audienceIdList(audiences: (number | Audience)[] | null | undefined): string[] {
  if (!audiences) {
    return []
  }

  return audiences
    .map((a) => (typeof a === 'number' ? String(a) : a?.id != null ? String(a.id) : null))
    .filter((id): id is string => id !== null)
}

/** A shaped `related-*` doc carrying the fields every card renders. */
type RelatedDoc = Record<string, unknown> & {
  id: number
  title: string
  thumbnailUrl: string
}

function isRenderableCard(doc: Record<string, unknown>): doc is RelatedDoc {
  return (
    typeof doc.id === 'number' &&
    typeof doc.title === 'string' &&
    doc.title.length > 0 &&
    typeof doc.thumbnailUrl === 'string' &&
    doc.thumbnailUrl.length > 0
  )
}

/**
 * The cards a shaped `related-*` endpoint answers.
 *
 * The endpoint already shapes cards. Still guard the rendered fields, so a
 * partial doc can never produce a blank card or a broken thumbnail.
 */
async function readRelatedCards(path: string, label: string): Promise<RelatedDoc[]> {
  // A 404 — an unknown anchor ID, or no related route — means no related
  // content, and arrives as `null`.
  const body = await sahajCloudFetchOptional<{ docs?: Array<Record<string, unknown>> }>(path, label)

  return (Array.isArray(body?.docs) ? body.docs : []).filter(isRenderableCard)
}

/**
 * Gets the meditations related to a lecture, from the shaped nested route
 * `GET /api/lectures/:id/related-meditations` (SahajCloud #523).
 *
 * Like `/songs`, this is not a collection `find`. The server does the
 * subtle-system-node-overlap ranking, with a recency-based top-up fallback,
 * and returns a fixed card projection. It ignores `select`, `populate`, and
 * `depth` (it does honor `locale` and `limit`). The SDK cannot model it, so
 * this function issues a raw authenticated fetch, wrapped in the shared
 * retry layer.
 *
 * The endpoint drops any card with no public title, duration, or thumbnail,
 * so the internal `label` never leaks. Meditation titles are not localized,
 * so the endpoint returns an empty list for a non-English locale. The
 * caller then renders no related section — this is graceful, not an error.
 * The function also returns `[]` for an unknown lecture ID (404).
 *
 * `null` is a failure that survived the retries, never an empty answer: the
 * route caches an answer and must not cache that.
 *
 * @param options.id - The lecture document ID (the anchor)
 * @param options.locale - The locale to retrieve meditation cards in
 * @param options.limit - Max cards to request (default 8)
 */
export async function getRelatedMeditations(
  options: LocalizedQueryOptions & {
    id: string
    limit?: number
  },
): Promise<RelatedMeditationCard[] | null> {
  const limit = options.limit ?? 8

  const read = async () => {
    const docs = await readRelatedCards(
      `/api/lectures/${encodeURIComponent(options.id)}/related-meditations` +
        `?locale=${encodeURIComponent(options.locale)}&limit=${limit}`,
      `getRelatedMeditations(${options.id})`,
    )

    return docs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      durationMinutes: typeof doc.durationMinutes === 'number' ? doc.durationMinutes : 0,
      thumbnailUrl: doc.thumbnailUrl,
      narratorName: typeof doc.narratorName === 'string' ? doc.narratorName : '',
    }))
  }

  // Related content is supplementary: a failure must never break the page.
  return degrade(() => withRetry(read, { reportFailure: false }), {
    source: 'getRelatedMeditations',
    message: 'getRelatedMeditations failed; rendering lecture without related',
    key: options.id,
    fallback: null,
    extra: { lectureId: options.id, locale: options.locale },
  })
}

/**
 * Gets the lectures related to a meditation, from the shaped nested route
 * `GET /api/meditations/:id/related-lectures` (the mirror of the endpoint
 * above). Unlike `/related-meditations`, this endpoint is audience-gated: it
 * requires the site's `audiences`, and 400s without them. With none
 * configured, this function returns `[]` immediately, instead of issuing a
 * request that would 400.
 *
 * The endpoint returns the full lecture player projection, ranked by node
 * overlap with an audience-and-recency fallback. This function returns only
 * the card subset: ID, title, thumbnail, and playable duration. It returns
 * `[]` for an unknown meditation ID (404), and `null` for a failure that
 * survives retries, as {@link getRelatedMeditations} does.
 *
 * @param options.id - The meditation document ID (the anchor)
 * @param options.locale - The locale to retrieve lecture cards in
 * @param options.audiences - The site's fixed audiences (WebConfig.audiences)
 * @param options.limit - Max cards to request (default 8)
 */
export async function getRelatedLectures(
  options: LocalizedQueryOptions & {
    id: string
    audiences: WebConfig['audiences']
    limit?: number
  },
): Promise<RelatedLectureCard[] | null> {
  const audiences = audienceIdList(options.audiences)

  // Audience-gated. With none configured, the site cannot call the endpoint
  // (it 400s), so degrade to no related section. This matches the
  // /for-audience content-index behavior. An admin sets audiences in the
  // WeMeditate Web config.
  if (audiences.length === 0) {
    return []
  }
  const limit = options.limit ?? 8

  const read = async () => {
    const docs = await readRelatedCards(
      `/api/meditations/${encodeURIComponent(options.id)}/related-lectures` +
        `?locale=${encodeURIComponent(options.locale)}&limit=${limit}` +
        `&audiences=${audiences.join(',')}`,
      `getRelatedLectures(${options.id})`,
    )

    return docs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      durationSeconds: typeof doc.duration === 'number' ? doc.duration : 0,
      thumbnailUrl: doc.thumbnailUrl,
    }))
  }

  return degrade(() => withRetry(read, { reportFailure: false }), {
    source: 'getRelatedLectures',
    message: 'getRelatedLectures failed; rendering meditation without related',
    key: options.id,
    fallback: null,
    extra: { meditationId: options.id, locale: options.locale },
  })
}
