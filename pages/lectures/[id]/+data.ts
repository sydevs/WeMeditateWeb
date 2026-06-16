import type { PageContextServer } from 'vike/types'
import { render } from 'vike/abort'
import type { ResolvedLecture, WebConfig } from '../../../server/cms-types'
import { getLecture, getWebConfig } from '../../../server/cms-client'
import { idSchema } from '../../../server/validation'

export interface LecturePageData {
  lecture: ResolvedLecture
  settings: WebConfig
  locale: string
  id: string
}

/**
 * Fetch lecture data by ID for server-side rendering (full layout).
 * getLecture normalizes full lectures and clips into the same shape.
 */
export async function data(pageContext: PageContextServer): Promise<LecturePageData> {
  const { locale, routeParams } = pageContext

  // Validate ID parameter - returns 404 for invalid IDs
  let id: string

  try {
    id = idSchema.parse(routeParams.id)
  } catch (error) {
    throw render(404, error instanceof Error ? error.message : 'Invalid ID')
  }

  // Fetch global settings (for LayoutDefault nav) and the lecture in parallel
  const [settings, lecture] = await Promise.all([
    getWebConfig({ locale }),
    getLecture({ id, locale }),
  ])

  if (!lecture) {
    // Lecture not found - throw 404
    throw render(404, `Lecture with ID "${id}" not found.`)
  }

  return {
    lecture,
    settings,
    locale,
    id,
  }
}
