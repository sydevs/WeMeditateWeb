import type { PageContextServer } from 'vike/types'
import { routeLocales } from '../../../lib/hreflang'
import type { MoodCard } from '../../../lib/content-blocks'
import { featuredMoodCards } from '../../../server/moods'
import { loadSiteContext } from '../../../server/site-context'
import type { Locale, WebConfig } from '../../../server/sahajcloud-types'

export interface MeditationsIndexData {
  moods: MoodCard[]
  locale: Locale
  settings: WebConfig
  alternateLocales: Locale[]
}

/**
 * Every featured mood's meditation, with no time-of-day filter: this page
 * lists what the finder can offer at any hour, not what it offers now.
 */
export async function data(pageContext: PageContextServer): Promise<MeditationsIndexData> {
  const { locale } = pageContext
  const site = await loadSiteContext(pageContext)
  const moods = await featuredMoodCards({ locale })

  return {
    moods,
    locale,
    settings: site.settings,
    alternateLocales: routeLocales(site.settings.availableLocales),
  }
}
