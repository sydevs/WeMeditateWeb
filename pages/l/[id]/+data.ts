import type { PageContextServer } from 'vike/types'
import { render } from 'vike/abort'
import type { ResolvedLecture } from '../../../server/cms-types'
import { getLecture } from '../../../server/cms-client'
import { idSchema } from '../../../server/validation'

export interface LectureEmbedPageData {
  lecture: ResolvedLecture
  locale: string
  id: string
}

/**
 * Fetch lecture data for the embed route (iframe).
 * Uses LayoutEmbed (passthrough), so — unlike the full route — it does NOT
 * fetch WeMeditateWebSettings (no Header/Footer/nav to populate).
 */
export async function data(pageContext: PageContextServer): Promise<LectureEmbedPageData> {
  const { locale, routeParams } = pageContext

  // Validate ID parameter - returns 404 for invalid IDs
  let id: string

  try {
    id = idSchema.parse(routeParams.id)
  } catch (error) {
    throw render(404, error instanceof Error ? error.message : 'Invalid ID')
  }

  const lecture = await getLecture({ id, locale })

  if (!lecture) {
    // Lecture not found - throw 404
    throw render(404, `Lecture with ID "${id}" not found.`)
  }

  return {
    lecture,
    locale,
    id,
  }
}
