import type { PageContextServer } from 'vike/types'
import { render } from 'vike/abort'
import type { Meditation, WeMeditateWebSettings } from '../../../server/cms-types'
import { getDocumentById, getWeMeditateWebSettings } from '../../../server/cms-client'
import { idSchema } from '../../../server/validation'

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
  const { locale, routeParams } = pageContext

  // Validate ID parameter - returns 404 for invalid IDs
  let id: string
  try {
    id = idSchema.parse(routeParams.id)
  } catch (error) {
    throw render(404, error instanceof Error ? error.message : 'Invalid ID')
  }

  // Fetch global settings and meditation in parallel
  const [settings, meditation] = await Promise.all([
    getWeMeditateWebSettings(),
    getDocumentById({ collection: 'meditations', id, locale }),
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
