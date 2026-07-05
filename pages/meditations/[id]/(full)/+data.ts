import type { PageContextServer } from 'vike/types'
import type { WebConfig } from '../../../../server/cms-types'
import { getWebConfig } from '../../../../server/cms-client'
import { loadMeditation, type MeditationData } from '../_meditation'

export interface MeditationPageData extends MeditationData {
  settings: WebConfig
}

/**
 * Fetch the meditation (shared with the embed route) plus the WebConfig that
 * LayoutChrome needs to render the nav, in parallel.
 *
 * Related lectures are NOT fetched here: the ranking endpoint is slow (~5s+), so
 * blocking SSR on it trips Vike's slow-hook warning. The full route renders the
 * related section client-side instead (RelatedContentLoader via the template's
 * showRelated flag).
 */
export async function data(pageContext: PageContextServer): Promise<MeditationPageData> {
  const [base, settings] = await Promise.all([
    loadMeditation(pageContext),
    getWebConfig({ locale: pageContext.locale }),
  ])

  return { ...base, settings }
}
