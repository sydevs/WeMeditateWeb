/**
 * Reads one lecture, resolved to the view model the player renders.
 */

import { resolveLecture } from '@/lib/content/lecture-shape'
import { warnOnce } from '@/server/error-utils'
import type { Lecture } from '@/types/sahajcloud'
import { getDocumentById } from './documents'
import type { LocalizedQueryOptions } from './query'

/**
 * Gets a lecture by ID.
 *
 * Returns the collection's own shape, which `resolveLecture` flattens at
 * render — on the server and, under live preview, again per streamed message.
 * A clip inherits its playback source (HLS URL, duration, base subtitles,
 * thumbnail fallback) from its parent `fullLecture`, populated at depth 2
 * (see LECTURE_POPULATE).
 *
 * @param options.id - The lecture document ID
 * @param options.locale - The locale to retrieve the lecture in
 * @param options.preview - If true, fetch draft data
 * @returns The lecture document, or null if not found
 */
export async function getLecture(
  options: LocalizedQueryOptions & {
    id: string
    preview?: boolean
    previewToken?: string
  },
): Promise<Lecture | null> {
  const lecture = await getDocumentById({ collection: 'lectures', ...options })

  if (!lecture) return null

  const resolved = resolveLecture(lecture)

  // A clip with no resolvable HLS source means its parent `fullLecture`
  // returned unpopulated (a bare id, believed unpublished or trashed), or has
  // not synced its Nirmala Vidya metadata. The template degrades to an error
  // state. Report the SahajCloud data gap to Sentry, per `server/AGENTS.md`, so
  // it stays visible.
  if (!options.preview && resolved.type === 'clip' && !resolved.hlsUrl) {
    console.warn(
      `[getLecture] clip ${resolved.id} has no resolvable HLS source (unpopulated or unsynced parent lecture)`,
    )
    // The gap stands until an editor fixes the parent, and this runs per
    // render. The locale is the first render's in this isolate, not the only one.
    warnOnce(String(resolved.id), 'Lecture clip has an unresolved parent (no HLS source)', {
      source: 'getLecture',
      extra: { lectureId: resolved.id, locale: options.locale ?? null },
    })
  }

  return lecture
}
