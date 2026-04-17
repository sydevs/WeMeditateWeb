import type { PageContextServer } from 'vike/types'
import { render } from 'vike/abort'
import type { Meditation, WebConfig } from '../../../server/cms-types'
import { getDocumentById, getWebConfig } from '../../../server/cms-client'
import { idSchema } from '../../../server/validation'

export interface MeditationEmbedPageData {
  meditation: Meditation
  settings: WebConfig
  locale: string
  id: string
}

/**
 * Fetch meditation data for embed route
 * This route is designed for embedding in iframes
 */
export async function data(pageContext: PageContextServer): Promise<MeditationEmbedPageData> {
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
    getWebConfig(),
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
