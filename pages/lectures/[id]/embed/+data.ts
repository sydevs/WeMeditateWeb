import type { PageContextServer } from 'vike/types'
import { loadLecture, type LectureData } from '../_lecture'

export type LectureEmbedPageData = LectureData

/**
 * Lecture embed route (/lectures/:id/embed). It inherits only the global
 * LayoutRoot, not LayoutChrome. Unlike the full route, it does not fetch
 * WeMeditateWebSettings. There is no nav to populate.
 */
export async function data(pageContext: PageContextServer): Promise<LectureEmbedPageData> {
  return loadLecture(pageContext)
}
