import type { PageContextServer } from 'vike/types'
import type { MoodCard } from '../../../lib/content-blocks'
import { featuredMoodCards } from '../../../server/moods'
import { loadSiteContext } from '../../../server/site-context'
import type { Locale, WebConfig } from '../../../server/sahajcloud-types'

export interface MeditationsIndexData {
  moods: MoodCard[]
  settings: WebConfig
  /**
   * Every locale the site offers. `/meditations` has no SahajCloud document, so
   * nothing publishes it per locale and there is no `advertisedLocales` filter
   * to apply — it renders in all of them.
   */
  alternateLocales: readonly Locale[]
}

/**
 * Every featured mood's meditation, with no time-of-day filter: this page
 * lists what the finder can offer at any hour, not what it offers now.
 */
export async function data(pageContext: PageContextServer): Promise<MeditationsIndexData> {
  const { locale } = pageContext
  // In parallel: `featuredMoodCards` reads only the locale, so waiting on the
  // site context would add a round trip to TTFB.
  const [site, moods] = await Promise.all([
    loadSiteContext(pageContext),
    featuredMoodCards({ locale }),
  ])

  return {
    moods,
    settings: site.settings,
    alternateLocales: site.settings.availableLocales,
  }
}
