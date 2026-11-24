/**
 * Reads a meditation's background music.
 */

import { degrade, withRetry } from '@/server/error-utils'
import { sahajCloudFetchOptional } from './fetch'
import { createPayloadClient } from './payload-client'
import { MEDITATION_STATUS_SELECT } from './selects'
import type { MeditationSong } from '@/types/sahajcloud'
import type { LocalizedQueryOptions } from './query'

/**
 * Gets the background-music tracks eligible for a meditation, from the
 * custom nested route `GET /api/meditations/:id/songs`.
 *
 * Unlike the standard collection reads in ./pages and ./documents, this endpoint does the
 * songTag and `includeForMeditations` selection on the server. It returns a
 * fixed minimal projection (`{ id, title, url, tags }`). It does not accept
 * `select`, and it ignores `populate`, `depth`, and `limit` (it does honor
 * `locale`). This is not a collection `find`, so the PayloadCMS SDK cannot
 * model it. This function instead reads through `sahajCloudFetchOptional`, wrapped
 * in the shared retry layer.
 *
 * The endpoint returns songs in a random order on every request. Callers
 * pick a track on the client, so a list held at the edge is fine. The
 * function returns an empty list when a meditation has no eligible songs
 * (HTTP 200, `{ docs: [] }`), for an unknown ID (HTTP 404), and for any
 * failure that survives retries, so the player simply renders voice-only.
 *
 * @param options.id - The meditation document ID
 * @param options.locale - The locale to retrieve songs in
 * @returns Playable music tracks (`{ id, title, url }`, url guaranteed non-empty)
 */
export async function getMeditationSongs(
  options: LocalizedQueryOptions & {
    id: string
  },
): Promise<MeditationSong[]> {
  const read = async () => {
    // A 404 — an unknown meditation ID, or no songs route — means no music,
    // and arrives as `null`. Every other non-OK throws, so the retry runs.
    const body = await sahajCloudFetchOptional<{
      docs?: Array<{ id: number; title?: string | null; url?: string | null }>
    }>(
      `/api/meditations/${encodeURIComponent(options.id)}/songs` +
        `?locale=${encodeURIComponent(options.locale)}`,
      `getMeditationSongs(${options.id})`,
    )
    const docs = Array.isArray(body?.docs) ? body.docs : []

    // Keep only playable tracks. The player needs a real URL. The
    // endpoint omits duration, artwork, and credit, so title and url are
    // all this function returns.
    return docs
      .filter((doc) => typeof doc.url === 'string' && doc.url.length > 0)
      .map((doc) => ({ id: doc.id, title: doc.title ?? '', url: doc.url as string }))
  }

  // Background music is supplementary: a failure, even after the retries,
  // renders the meditation voice-only.
  return degrade(() => withRetry(read, { reportFailure: false }), {
    source: 'getMeditationSongs',
    message: 'getMeditationSongs failed; rendering meditation voice-only',
    key: options.id,
    fallback: [],
    extra: { meditationId: options.id, locale: options.locale },
  })
}

/**
 * Which of `ids` name a published meditation, in one read rather than one
 * `findByID` each: on the mood picker's SSR path that is up to fourteen
 * requests saved.
 *
 * ⚠ **`locale: 'all'`, never a single locale.** `filterMeditationsByLocale`
 * filters every `find` to `req.locale`, so a read at any single non-English
 * locale answers `totalDocs: 0` — and `locale: 'en'` answers while dropping a
 * localized slot, because a French mood may name a French meditation. See
 * AGENTS.md.
 *
 * It answers `null` for a failure, which the caller must tell from "nothing
 * published": an empty map would drop every mood's tile and warn once per
 * mood, where `null` drops the picker as a whole, once.
 */
export async function getPublishedMeditationIds(
  ids: (number | string)[],
): Promise<Set<string> | null> {
  if (ids.length === 0) return new Set()

  const read = async () => {
    const client = createPayloadClient()

    const result = await client.find({
      collection: 'meditations',
      where: { id: { in: ids } },
      locale: 'all',
      limit: ids.length,
      depth: 0,
      select: MEDITATION_STATUS_SELECT,
    })

    const docs = (result?.docs ?? []) as { id?: number | string; _status?: unknown }[]

    // A client read is already filtered to published documents by the access
    // config, so this is the second line of defence rather than the thing that
    // prevents a dead link — do not read it as the first.
    return new Set(docs.filter((doc) => doc._status !== 'draft').map((doc) => String(doc.id)))
  }

  return degrade(() => withRetry(read, { reportFailure: false }), {
    source: 'getPublishedMeditationIds',
    message: 'a mood picker could not read the meditations its moods name',
    fallback: null,
  })
}
