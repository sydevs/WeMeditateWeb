import type { PageContextServer } from 'vike/types'
import type { WebConfig } from '../../../../server/cms-types'
import { getWebConfig } from '../../../../server/cms-client'
import { loadLecture, type LectureData } from '../_lecture'

export interface LecturePageData extends LectureData {
  settings: WebConfig
}

/**
 * Fetch the lecture (shared with the embed route) plus the WebConfig that
 * LayoutChrome needs to render the nav, in parallel.
 */
export async function data(pageContext: PageContextServer): Promise<LecturePageData> {
  const [base, settings] = await Promise.all([
    loadLecture(pageContext),
    getWebConfig({ locale: pageContext.locale }),
  ])

  return { ...base, settings }
}
