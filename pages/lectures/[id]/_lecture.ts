import type { PageContextServer } from 'vike/types'
import { render } from 'vike/abort'
import type { Lecture, Locale } from '../../../server/sahajcloud-types'
import { getLecture } from '../../../server/sahajcloud-client'
import { idSchema } from '../../../server/validation'
import { loadLivePreview, previewArgs } from '../../../server/live-preview'

export interface LectureData {
  /**
   * The collection's own shape, as both sibling preview routes carry theirs.
   * `resolveLecture` flattens it at render, which is where a streamed message
   * has to be flattened too — `mergeData` lays unsaved fields over the
   * document, so a view model in its place would take raw fields on top of
   * itself.
   */
  lecture: Lecture
  locale: Locale
  id: string
}

/**
 * Validate the route id and fetch the lecture. Shared by the full
 * (/lectures/:id) and embed (/lectures/:id/embed) routes so the two stay in
 * lockstep. Throws a 404 for an invalid id or a missing lecture.
 */
export async function loadLecture(pageContext: PageContextServer): Promise<LectureData> {
  const { locale, routeParams } = pageContext

  let id: string

  try {
    id = idSchema.parse(routeParams.id)
  } catch (error) {
    throw render(404, error instanceof Error ? error.message : 'Invalid ID')
  }

  // Lectures carry no drafts, so this unlocks nothing — but the preview
  // header keeps the read out of the edge cache, which is what lets an
  // editor see a save they just made.
  const preview = await loadLivePreview(pageContext)

  const lecture = await getLecture({ id, locale, ...previewArgs(preview) })

  if (!lecture) {
    throw render(404, `Lecture with ID "${id}" not found.`)
  }

  return { lecture, locale, id }
}
