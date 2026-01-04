import type { PageContextServer } from 'vike/types'
import { render } from 'vike/abort'
import type { Meditation, WeMeditateWebSettings } from '../../../server/cms-types'
import { getMeditationById, getWeMeditateWebSettings } from '../../../server/cms-client'

export interface MeditationPageData {
  meditation: Meditation
  settings: WeMeditateWebSettings
  locale: string
  id: string
}

/**
 * Fetch meditation data by ID for server-side rendering
 */
export async function data(pageContext: PageContextServer): Promise<MeditationPageData> {
  const { locale, routeParams: { id } } = pageContext

  // Fetch global settings and meditation in parallel
  const [settings, meditation] = await Promise.all([
    getWeMeditateWebSettings(),
    getMeditationById({ id, locale }),
  ])

  if (!meditation) {
    // Meditation not found - throw 404
    throw render(404, `Meditation with ID "${id}" not found.`)
  }

  return {
    meditation,
    settings,
    locale,
    id,
  }
}
