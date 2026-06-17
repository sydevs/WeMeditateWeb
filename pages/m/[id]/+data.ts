import type { PageContextServer } from 'vike/types'
import { render } from 'vike/abort'
import type { Meditation } from '../../../server/cms-types'
import { getDocumentById } from '../../../server/cms-client'
import { idSchema } from '../../../server/validation'

export interface MeditationEmbedPageData {
  meditation: Meditation
  locale: string
  id: string
}

/**
 * Fetch meditation data for the embed route (iframe).
 *
 * Unlike the full route, this does NOT fetch WeMeditateWebSettings: LayoutDefault
 * renders the bare player whenever page data carries no `settings` (its
 * `if (!settings) return <>{children}</>` branch), which is what makes the embed
 * chrome-free. Providing settings here would render the full Header/Footer/nav.
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

  const meditation = await getDocumentById({ collection: 'meditations', id, locale })

  if (!meditation) {
    // Meditation not found - throw 404
    throw render(404, `Meditation with ID "${id}" not found.`)
  }

  return {
    meditation,
    locale,
    id,
  }
}
