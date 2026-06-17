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
 */
export async function data(pageContext: PageContextServer): Promise<MeditationPageData> {
  const [base, settings] = await Promise.all([
    loadMeditation(pageContext),
    getWebConfig({ locale: pageContext.locale }),
  ])

  return { ...base, settings }
}
