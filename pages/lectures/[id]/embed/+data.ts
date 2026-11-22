import type { PageContextServer } from 'vike/types'
import { loadLecture, type LectureData } from '@/pages/lectures/[id]/_lecture'

export type LectureEmbedPageData = LectureData

/**
 * Lecture embed route (/lectures/:id/embed). It inherits only the global
 * LayoutRoot, not LayoutChrome. Unlike the full route, it does not fetch
 * WeMeditateWebSettings. There is no nav to populate.
 *
 * SahajCloud points its preview panel at `/lectures/:id`, so this route mounts
 * no subscriber and resolves the lecture once, for the render.
 */
export async function data(pageContext: PageContextServer): Promise<LectureEmbedPageData> {
  return loadLecture(pageContext)
}
