import type { PageContextServer } from 'vike/types'
import type { WebConfig, RelatedLectureCard } from '../../../../server/cms-types'
import { getWebConfig, getRelatedLectures } from '../../../../server/cms-client'
import { loadMeditation, type MeditationData } from '../_meditation'

export interface MeditationPageData extends MeditationData {
  settings: WebConfig
  /** Lectures related to this meditation, shown below the player. Empty when
   * the site has no audiences configured, there are none, or the fetch
   * degrades (the section is then omitted). */
  relatedLectures: RelatedLectureCard[]
}

/**
 * Fetch the meditation (shared with the embed route) plus the WebConfig that
 * LayoutChrome needs, in parallel — then the related lectures, which is
 * audience-gated so it needs the config's `audiences` first. Related content is
 * fetched only here on the full route (the embed route stays player-only), and
 * `getRelatedLectures` degrades to [] on any failure, so it never blocks the page.
 */
export async function data(pageContext: PageContextServer): Promise<MeditationPageData> {
  const [base, settings] = await Promise.all([
    loadMeditation(pageContext),
    getWebConfig({ locale: pageContext.locale }),
  ])

  const relatedLectures = await getRelatedLectures({
    id: base.id,
    locale: pageContext.locale,
    audiences: settings.audiences,
  })

  return { ...base, settings, relatedLectures }
}
