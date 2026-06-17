import type { PageContextServer } from 'vike/types'
import { render } from 'vike/abort'
import type { Meditation } from '../../../server/cms-types'
import { getDocumentById } from '../../../server/cms-client'
import { idSchema } from '../../../server/validation'

export interface MeditationData {
  meditation: Meditation
  locale: string
  id: string
}

/**
 * Validate the route id and fetch the meditation. Shared by the full
 * (/meditations/:id) and embed (/meditations/:id/embed) routes so the two stay in
 * lockstep. Throws a 404 for an invalid id or a missing meditation.
 */
export async function loadMeditation(pageContext: PageContextServer): Promise<MeditationData> {
  const { locale, routeParams } = pageContext

  let id: string

  try {
    id = idSchema.parse(routeParams.id)
  } catch (error) {
    throw render(404, error instanceof Error ? error.message : 'Invalid ID')
  }

  const meditation = await getDocumentById({ collection: 'meditations', id, locale })

  if (!meditation) {
    throw render(404, `Meditation with ID "${id}" not found.`)
  }

  return { meditation, locale, id }
}
