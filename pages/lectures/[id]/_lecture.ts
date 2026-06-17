import type { PageContextServer } from 'vike/types'
import { render } from 'vike/abort'
import type { ResolvedLecture } from '../../../server/cms-types'
import { getLecture } from '../../../server/cms-client'
import { idSchema } from '../../../server/validation'

export interface LectureData {
  lecture: ResolvedLecture
  locale: string
  id: string
}

/**
 * Validate the route id and fetch the lecture. Shared by the full
 * (/lectures/:id) and embed (/lectures/:id/embed) routes so the two stay in
 * lockstep. getLecture normalizes full lectures and clips into the same shape.
 * Throws a 404 for an invalid id or a missing lecture.
 */
export async function loadLecture(pageContext: PageContextServer): Promise<LectureData> {
  const { locale, routeParams } = pageContext

  let id: string

  try {
    id = idSchema.parse(routeParams.id)
  } catch (error) {
    throw render(404, error instanceof Error ? error.message : 'Invalid ID')
  }

  const lecture = await getLecture({ id, locale })

  if (!lecture) {
    throw render(404, `Lecture with ID "${id}" not found.`)
  }

  return { lecture, locale, id }
}
