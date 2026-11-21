/**
 * Reads a meditation's background music.
 */

import { withRetry } from '@/server/error-utils'
import { sahajCloudFetchOptional } from './fetch'
import { degrade } from '@/server/error-utils'
import type { MeditationSong } from '@/types/sahajcloud'
import type { LocalizedQueryOptions } from './query'

/**
 * Gets the background-music tracks eligible for a meditation, from the
 * custom nested route `GET /api/meditations/:id/songs`.
 *
 * Unlike the standard collection reads above, this endpoint does the
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
