import type { PageContextServer } from 'vike/types'
import { render } from 'vike/abort'
import type { Meditation, MeditationSong } from '../../../server/cms-types'
import { getDocumentById, getMeditationSongs } from '../../../server/cms-client'
import { idSchema } from '../../../server/validation'

export interface MeditationData {
  meditation: Meditation
  /**
   * Background-music tracks layered under the guided voice in the player. Empty
   * when the meditation has no eligible songs (the player renders voice-only).
   */
  musicTracks: MeditationSong[]
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

  // Fetch the meditation and its background-music tracks in parallel. Both the
  // full and embed routes call this, so music reaches both.
  const [meditation, musicTracks] = await Promise.all([
    getDocumentById({ collection: 'meditations', id, locale }),
    getMeditationSongs({ id, locale }),
  ])

  if (!meditation) {
    throw render(404, `Meditation with ID "${id}" not found.`)
  }

  return { meditation, musicTracks, locale, id }
}
