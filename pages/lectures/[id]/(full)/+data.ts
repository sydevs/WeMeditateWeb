import type { PageContextServer } from 'vike/types'
import type { WebConfig, RelatedMeditationCard } from '../../../../server/cms-types'
import { getWebConfig, getRelatedMeditations } from '../../../../server/cms-client'
import { loadLecture, type LectureData } from '../_lecture'

export interface LecturePageData extends LectureData {
  settings: WebConfig
  /** Meditations related to this lecture, shown below the player. Empty when
   * there are none or the fetch degrades (the section is then omitted). */
  relatedMeditations: RelatedMeditationCard[]
}

/**
 * Fetch the lecture (shared with the embed route) plus the WebConfig that
 * LayoutChrome needs, in parallel — then the related meditations (keyed on the
 * validated lecture id). Related content is fetched only here on the full
 * route, so the embed route stays player-only. `getRelatedMeditations` degrades
 * to [] on any failure, so it never blocks the page.
 */
export async function data(pageContext: PageContextServer): Promise<LecturePageData> {
  const [base, settings] = await Promise.all([
    loadLecture(pageContext),
    getWebConfig({ locale: pageContext.locale }),
  ])

  const relatedMeditations = await getRelatedMeditations({
    id: base.id,
    locale: pageContext.locale,
  })

  return { ...base, settings, relatedMeditations }
}
