/**
 * The loader both meditation routes share.
 *
 * The keyframes a meditation arrives with, and the narrowing applied to them,
 * belong to `getDocumentById` — see `server/sahajcloud-client.test.ts`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PageContextServer } from 'vike/types'
import type { Meditation } from '../../../server/sahajcloud-types'
import type { LivePreviewSession } from '../../../server/live-preview'

const getDocumentById = vi.fn()
const getMeditationSongs = vi.fn()
const loadLivePreview = vi.fn()

vi.mock('../../../server/sahajcloud-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../server/sahajcloud-client')>()),
  getDocumentById: (...args: unknown[]) => getDocumentById(...args),
  getMeditationSongs: (...args: unknown[]) => getMeditationSongs(...args),
}))
vi.mock('../../../server/live-preview', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../server/live-preview')>()),
  loadLivePreview: (...args: unknown[]) => loadLivePreview(...args),
}))

const { loadMeditation } = await import('./_meditation')
const { LIVE_PREVIEW_OFF } = await import('../../../server/live-preview')

const MEDITATION = {
  id: 17,
  title: 'Meditation for Right Channel',
  durationMinutes: 11,
  _status: 'published',
  frames: [{ id: 12, timestamp: 0, url: 'https://example.test/12/public', mimeType: 'image/webp' }],
} as unknown as Meditation

function pageContext(id: string, locale = 'en'): PageContextServer {
  return { locale, routeParams: { id } } as unknown as PageContextServer
}

/** The status a thrown `render()` carries, or the error itself when it is not one. */
async function abortStatusOf(promise: Promise<unknown>): Promise<number> {
  try {
    await promise
  } catch (error) {
    const status = (error as { _pageContextAbort?: { abortStatusCode?: number } })._pageContextAbort
      ?.abortStatusCode

    if (status === undefined) throw error

    return status
  }

  throw new Error('expected the loader to abort')
}

beforeEach(() => {
  getDocumentById.mockReset().mockResolvedValue(MEDITATION)
  getMeditationSongs.mockReset().mockResolvedValue([])
  loadLivePreview.mockReset().mockResolvedValue(LIVE_PREVIEW_OFF)
})

describe('loadMeditation', () => {
  it('answers an id that is not one with a 404, before any read', async () => {
    expect(await abortStatusOf(loadMeditation(pageContext('not-an-id')))).toBe(404)
    expect(getDocumentById).not.toHaveBeenCalled()
  })

  it('answers a meditation SahajCloud does not hold with a 404', async () => {
    getDocumentById.mockResolvedValue(null)

    expect(await abortStatusOf(loadMeditation(pageContext('999999')))).toBe(404)
  })

  it('reads the meditation and its music in the route locale', async () => {
    const tracks = [{ id: 3, title: 'Tanpura' }]

    getMeditationSongs.mockResolvedValue(tracks)

    const result = await loadMeditation(pageContext('17', 'fr'))

    expect(getDocumentById).toHaveBeenCalledWith({
      collection: 'meditations',
      id: '17',
      locale: 'fr',
      preview: false,
      previewToken: undefined,
    })
    expect(getMeditationSongs).toHaveBeenCalledWith({ id: '17', locale: 'fr' })
    expect(result).toMatchObject({
      meditation: MEDITATION,
      musicTracks: tracks,
      locale: 'fr',
      id: '17',
    })
  })

  it('asks for the draft only while the panel is previewing this meditation', async () => {
    const session: LivePreviewSession = { active: true, scope: null, token: 'signed-token' }

    loadLivePreview.mockResolvedValue(session)

    await loadMeditation(pageContext('17'))

    expect(getDocumentById).toHaveBeenCalledWith(
      expect.objectContaining({ preview: true, previewToken: 'signed-token' }),
    )
    // The music is never a draft: the panel edits the meditation, not its songs.
    expect(getMeditationSongs).toHaveBeenCalledWith({ id: '17', locale: 'en' })
  })

  it('reads the published meditation while the panel is previewing a global', async () => {
    const session: LivePreviewSession = { active: true, scope: 'wm-web-config', token: 't' }

    loadLivePreview.mockResolvedValue(session)

    await loadMeditation(pageContext('17'))

    expect(getDocumentById).toHaveBeenCalledWith(
      expect.objectContaining({ preview: false, previewToken: undefined }),
    )
  })
})
