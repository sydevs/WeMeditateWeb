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
 * Fetch the lecture (shared with the embed route), the WebConfig that
 * LayoutChrome needs, and the related meditations — all in parallel. Unlike the
 * meditation route (whose related fetch needs the config's audiences),
 * getRelatedMeditations needs only the route id, so it joins the same
 * Promise.all. Related content is fetched only here on the full route, so the
 * embed route stays player-only; getRelatedMeditations degrades to [] on any
 * failure (and a malformed id makes loadLecture 404 the page anyway), so it
 * never blocks or breaks rendering.
 */
export async function data(pageContext: PageContextServer): Promise<LecturePageData> {
  const [base, settings, relatedMeditations] = await Promise.all([
    loadLecture(pageContext),
    getWebConfig({ locale: pageContext.locale }),
    getRelatedMeditations({ id: pageContext.routeParams.id, locale: pageContext.locale }),
  ])

  return { ...base, settings, relatedMeditations }
}
