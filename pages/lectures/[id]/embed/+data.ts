import type { PageContextServer } from 'vike/types'
import { loadLecture, type LectureData } from '../_lecture'

export type LectureEmbedPageData = LectureData

/**
 * Lecture embed route (/lectures/:id/embed). It inherits only the global
 * LayoutRoot, not LayoutChrome. Unlike the full route, it does not fetch
 * WeMeditateWebSettings. There is no nav to populate.
 *
 * It drops the raw document the loader returns. SahajCloud points its preview
 * panel at `/lectures/:id`, so nothing here subscribes, and a second copy of
 * the lecture would ride into the browser for a stream this route never opens.
 */
export async function data(pageContext: PageContextServer): Promise<LectureEmbedPageData> {
  const { lecture, locale, id } = await loadLecture(pageContext)

  return { lecture, locale, id }
}
