import type { PageContextServer } from 'vike/types'
import type { WebConfig } from '../../../../server/cms-types'
import { loadSiteContext } from '../../../../server/site-context'
import { loadMeditation, type MeditationData } from '../_meditation'

export interface MeditationPageData extends MeditationData {
  settings: WebConfig
}

/**
 * Fetch the meditation (shared with the embed route) plus the WebConfig
 * that LayoutChrome needs to render the nav, in parallel.
 *
 * This does not fetch related lectures here. The ranking endpoint is slow
 * (~5s+), so blocking SSR on it trips Vike's slow-hook warning. The full
 * route renders the related section client-side instead
 * (RelatedContentLoader, through the template's showRelated flag).
 */
export async function data(pageContext: PageContextServer): Promise<MeditationPageData> {
  const [base, site] = await Promise.all([loadMeditation(pageContext), loadSiteContext(pageContext)])

  return { ...base, settings: site.settings }
}
