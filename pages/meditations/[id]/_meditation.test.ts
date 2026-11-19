/**
 * The loader both meditation routes share.
 *
 * The keyframes are SahajCloud's answer for meditations 17 and 130, trimmed:
 * every key a keyframe arrives with is kept, because the narrowing is about
 * exactly those keys, and so is the chakra keyframe's populated `page`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { PageContextServer } from 'vike/types'
import type { Meditation } from '../../../server/sahajcloud-types'
import type { LivePreviewSession } from '../../../server/live-preview'

const getDocumentById = vi.fn()
const getMeditationSongs = vi.fn()
const loadLivePreview = vi.fn()
/** Each `frames` prop the stubbed player was handed, in render order. */
const playerFrames: unknown[] = []

vi.mock('../../../server/sahajcloud-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../server/sahajcloud-client')>()),
  getDocumentById: (...args: unknown[]) => getDocumentById(...args),
  getMeditationSongs: (...args: unknown[]) => getMeditationSongs(...args),
}))
vi.mock('../../../server/live-preview', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../server/live-preview')>()),
  loadLivePreview: (...args: unknown[]) => loadLivePreview(...args),
}))
// The server render shows one keyframe, so markup cannot compare the rest.
// The prop the template builds from all of them can.
vi.mock('../../../components/organisms/MeditationPlayer', () => ({
  MeditationPlayer: ({ frames }: { frames: unknown }) => {
    playerFrames.push(frames)

    return null
  },
}))

const { loadMeditation } = await import('./_meditation')
const { LIVE_PREVIEW_OFF } = await import('../../../server/live-preview')
const { MeditationTemplate } = await import('../../../components/templates/MeditationTemplate')

const READY_FRAME = {
  id: 12,
  timestamp: 0,
  imageSet: 'female',
  subtleSystemNode: null,
  label: 'Ready, palms open',
  tags: ['ready'],
  duration: null,
  fileMetadata: { originalFilename: 'meditate_ready_girl_processed.webp' },
  prefix: '',
  _objectKey: null,
  updatedAt: '2026-10-13T09:05:56.025Z',
  createdAt: '2026-01-22T10:44:00.517Z',
  thumbnailURL: null,
  filename: '564068d6-af28-4103-19cf-8808975f7e00',
  mimeType: 'image/webp',
  filesize: 38266,
  width: 900,
  height: 900,
  focalX: 50,
  focalY: 50,
  hlsUrl: null,
  mp4Url: null,
  previewUrl:
    'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/564068d6-af28-4103-19cf-8808975f7e00/format=auto,width=320,height=320,fit=cover',
  url: 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/564068d6-af28-4103-19cf-8808975f7e00/public',
}

const CHAKRA_FRAME = {
  id: 48,
  timestamp: 114,
  imageSet: 'female',
  subtleSystemNode: {
    id: 8,
    slug: 'sahasrara',
    page: {
      id: 59,
      title: 'Sahasrara Chakra',
      content: {
        root: {
          type: 'root',
          children: [
            {
              type: 'upload',
              value: 283,
              fields: { align: 'center' },
              version: 1,
              relationTo: 'images',
            },
          ],
        },
      },
      meta: { title: null, description: null, image: null },
      generateSlug: false,
      slug: 'sahasrara-chakra',
      author: null,
      featuredVideo: null,
      tags: [],
      managers: [],
      updatedAt: '2026-05-22T18:20:42.739Z',
      createdAt: '2026-01-23T09:21:28.194Z',
      _status: 'published',
      webPath: 'sahasrara-chakra',
      webUrl: 'https://wemeditate.com/sahasrara-chakra',
    },
    lectures: { docs: [], hasNextPage: false },
    frames: { docs: [81, 80, 79, 78, 50, 49, 48, 47], hasNextPage: false },
    updatedAt: '2026-06-08T04:40:44.649Z',
    createdAt: '2026-04-28T12:13:36.856Z',
  },
  label: null,
  tags: ['hand', 'massage'],
  duration: null,
  fileMetadata: { originalFilename: 'sahasrara.webp' },
  prefix: '',
  _objectKey: null,
  updatedAt: '2026-01-22T10:46:48.530Z',
  createdAt: '2026-01-22T10:46:48.530Z',
  thumbnailURL: null,
  filename: 'f945928e-4574-4ed9-a7f3-bb40d91aec00',
  mimeType: 'image/webp',
  filesize: 537462,
  width: 1500,
  height: 1500,
  focalX: 50,
  focalY: 50,
  hlsUrl: null,
  mp4Url: null,
  previewUrl:
    'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/f945928e-4574-4ed9-a7f3-bb40d91aec00/format=auto,width=320,height=320,fit=cover',
  url: 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/f945928e-4574-4ed9-a7f3-bb40d91aec00/public',
}

/** Meditation 130's one video keyframe, given a duration to carry through. */
const VIDEO_FRAME = {
  id: 79,
  timestamp: 641,
  imageSet: 'female',
  subtleSystemNode: null,
  label: null,
  tags: ['massage'],
  duration: 14,
  fileMetadata: { originalFilename: '079-sahasrara-massage-lakshmi.mp4' },
  prefix: '',
  _objectKey: null,
  updatedAt: '2026-10-13T13:22:30.623Z',
  createdAt: '2026-01-22T13:00:26.894Z',
  thumbnailURL:
    'https://customer-aorobtik2fce41s5.cloudflarestream.com/8990dc42cc2e50229f37b612f5fc85f7/thumbnails/thumbnail.jpg?height=320',
  filename: '8990dc42cc2e50229f37b612f5fc85f7',
  mimeType: 'video/mp4',
  filesize: 3964026,
  width: null,
  height: null,
  focalX: null,
  focalY: null,
  hlsUrl:
    'https://customer-aorobtik2fce41s5.cloudflarestream.com/8990dc42cc2e50229f37b612f5fc85f7/manifest/video.m3u8',
  mp4Url:
    'https://customer-aorobtik2fce41s5.cloudflarestream.com/8990dc42cc2e50229f37b612f5fc85f7/downloads/default.mp4',
  previewUrl:
    'https://customer-aorobtik2fce41s5.cloudflarestream.com/8990dc42cc2e50229f37b612f5fc85f7/thumbnails/thumbnail.jpg?height=320',
  url: 'https://customer-aorobtik2fce41s5.cloudflarestream.com/8990dc42cc2e50229f37b612f5fc85f7/manifest/video.m3u8',
}

function meditationAsRead(frames: unknown = [READY_FRAME, CHAKRA_FRAME, VIDEO_FRAME]): Meditation {
  return {
    id: 17,
    duration: 629,
    subtleSystemNodeWeights: { pingala: 169, sahasrara: 159 },
    thumbnail: {
      id: 49,
      alt: 'Meditation placeholder image',
      filename: '5d20f294-c449-451d-c5f4-542c2ae1f600',
      width: 1471,
      height: 900,
      url: 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/5d20f294-c449-451d-c5f4-542c2ae1f600/public',
    },
    frames,
    _status: 'published',
    filename: 'calm10-kg6di3xa7q.mp3',
    durationMinutes: 11,
    title: 'Meditation for Right Channel',
    url: 'https://assets.sydevelopers.com/calm10-kg6di3xa7q.mp3',
  } as unknown as Meditation
}

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
  getDocumentById.mockReset().mockResolvedValue(meditationAsRead())
  getMeditationSongs.mockReset().mockResolvedValue([])
  loadLivePreview.mockReset().mockResolvedValue(LIVE_PREVIEW_OFF)
  playerFrames.length = 0
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
    expect(result).toMatchObject({ musicTracks: tracks, locale: 'fr', id: '17' })
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

  it('ships each keyframe with only the fields the player reads', async () => {
    const { meditation } = await loadMeditation(pageContext('17'))

    expect(meditation.frames).toEqual([
      { id: 12, timestamp: 0, url: READY_FRAME.url, mimeType: 'image/webp', duration: null },
      { id: 48, timestamp: 114, url: CHAKRA_FRAME.url, mimeType: 'image/webp', duration: null },
      { id: 79, timestamp: 641, url: VIDEO_FRAME.url, mimeType: 'video/mp4', duration: 14 },
    ])
    // The page document a chakra keyframe drags in is what this is for.
    expect(JSON.stringify(meditation)).not.toContain('sahasrara-chakra')
  })

  it('keeps every field of the meditation itself, which the player and the head read', async () => {
    const { meditation } = await loadMeditation(pageContext('17'))

    expect({ ...meditation, frames: null }).toEqual({ ...meditationAsRead(), frames: null })
  })

  it('leaves a meditation with no keyframes as it came, for the thumbnail fallback', async () => {
    getDocumentById.mockResolvedValue(meditationAsRead(null))

    const { meditation } = await loadMeditation(pageContext('17'))

    expect(meditation.frames).toBeNull()
  })

  it('hands the player the same keyframes as the whole document would', async () => {
    const { meditation } = await loadMeditation(pageContext('17'))

    // No Embed button: it is browser-only, and needs a Vike app to render.
    for (const document of [meditationAsRead(), meditation]) {
      renderToStaticMarkup(
        createElement(MeditationTemplate, { meditation: document, showEmbedButton: false }),
      )
    }

    const [fromWhole, fromNarrowed] = playerFrames

    expect(fromWhole).toHaveLength(3)
    expect(fromWhole).toContainEqual(
      expect.objectContaining({
        timestamp: 641,
        media: expect.objectContaining({ type: 'video', duration: 14 }),
      }),
    )
    expect(fromNarrowed).toEqual(fromWhole)
  })
})
