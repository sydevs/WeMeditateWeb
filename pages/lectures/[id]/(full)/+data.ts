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
 *
 * This does not fetch related meditations here. The ranking endpoint is
 * slow (~12s), so blocking SSR on it trips Vike's slow-hook warning. The
 * full route renders the related section client-side instead
 * (RelatedContentLoader, through the template's showRelated flag).
 */
export async function data(pageContext: PageContextServer): Promise<LecturePageData> {
  const [base, settings] = await Promise.all([
    loadLecture(pageContext),
    getWebConfig({ locale: pageContext.locale }),
  ])

  return { ...base, settings }
}
