import type { PageContextServer } from 'vike/types'
import type { MoodCard } from '../../../lib/content-blocks'
import { meditationsIndexSeo, seoRoute } from '../../../lib/content-seo'
import type { SeoDocument } from '../../../lib/head'
import { featuredMoodCards } from '../../../server/moods'
import { loadSiteContext } from '../../../server/site-context'
import type { WebConfig } from '../../../server/sahajcloud-types'

export interface MeditationsIndexData {
  moods: MoodCard[]
  settings: WebConfig
  seo: SeoDocument
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
    seo: meditationsIndexSeo({
      // No `advertisedLocales` filter: nothing publishes this URL per locale,
      // so every locale the site offers is a translation of it.
      locales: site.settings.availableLocales,
      route: seoRoute(pageContext, site.t),
    }),
  }
}
