import type { PageContextServer } from 'vike/types'
import { loadMeditation, type MeditationData } from '../_meditation'

export type MeditationEmbedPageData = MeditationData

/**
 * Meditation embed route (/meditations/:id/embed). It inherits only the
 * global LayoutRoot, not LayoutChrome. Unlike the full route, it does not
 * fetch WeMeditateWebSettings. There is no nav to populate.
 */
export async function data(pageContext: PageContextServer): Promise<MeditationEmbedPageData> {
  return loadMeditation(pageContext)
}
