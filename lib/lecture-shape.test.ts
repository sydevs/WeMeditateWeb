import { describe, it, expect } from 'vitest'
import type { Lecture } from '../server/payload-types'
import { mergeSubtitles, parseLectureMetadata, resolveLecture } from './lecture-shape'

// Minimal Lecture factory. Only the fields resolveLecture reads matter.
// The rest are stubbed to satisfy the generated type.
function makeLecture(overrides: Partial<Lecture>): Lecture {
  return {
    id: 1,
    type: 'full',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as Lecture
}

// Typed as the CMS `metadata` json (a string-keyed record), so it slots into
// `Lecture['metadata']` without a cast.
const FULL_METADATA: Record<string, unknown> = {
  title: 'The Subtle System',
  thumbnailUrl: 'https://cdn.nv/thumb.jpg',
  hlsUrl: 'https://cdn.nv/full.m3u8',
  duration: 3600,
  subtitles: {
    en: 'https://cdn.nv/en.vtt',
    fr: 'https://cdn.nv/fr.vtt',
  },
  lastSyncedAt: '2026-01-01T00:00:00.000Z',
}

describe('parseLectureMetadata', () => {
  it('returns null for non-object metadata (null, primitive, array)', () => {
    expect(parseLectureMetadata(null)).toBeNull()
    expect(parseLectureMetadata('a string')).toBeNull()
    expect(parseLectureMetadata(42)).toBeNull()
    expect(parseLectureMetadata([1, 2, 3])).toBeNull()
  })

  it('extracts known fields and a locale→url subtitle map', () => {
    const parsed = parseLectureMetadata({
      title: 'Talk',
      thumbnailUrl: 'https://cdn/thumb.jpg',
      hlsUrl: 'https://cdn/v.m3u8',
      duration: 1800,
      subtitles: { en: 'https://cdn/en.vtt', de: 'https://cdn/de.vtt' },
      lastSyncedAt: '2026-01-01T00:00:00.000Z',
    })

    expect(parsed).toEqual({
      title: 'Talk',
      thumbnailUrl: 'https://cdn/thumb.jpg',
      hlsUrl: 'https://cdn/v.m3u8',
      duration: 1800,
      subtitles: { en: 'https://cdn/en.vtt', de: 'https://cdn/de.vtt' },
      lastSyncedAt: '2026-01-01T00:00:00.000Z',
    })
  })

  it('drops empty/non-string subtitle urls and non-finite durations', () => {
    const parsed = parseLectureMetadata({
      duration: Number.NaN,
      subtitles: { en: 'https://cdn/en.vtt', fr: '', ru: 123 },
    })

    expect(parsed?.duration).toBeUndefined()
    expect(parsed?.subtitles).toEqual({ en: 'https://cdn/en.vtt' })
  })
})

describe('mergeSubtitles', () => {
  it('returns parent tracks alone when there are no overrides', () => {
    expect(mergeSubtitles({ en: 'https://p/en.vtt', fr: 'https://p/fr.vtt' }, null)).toEqual([
      { locale: 'en', url: 'https://p/en.vtt' },
      { locale: 'fr', url: 'https://p/fr.vtt' },
    ])
  })

  it('lets a clip override replace the parent track for a locale and add new ones', () => {
    const merged = mergeSubtitles({ en: 'https://p/en.vtt', fr: 'https://p/fr.vtt' }, [
      { locale: 'fr', url: 'https://clip/fr.vtt' },
      { locale: 'de', url: 'https://clip/de.vtt' },
    ])

    expect(merged).toEqual([
      { locale: 'de', url: 'https://clip/de.vtt' },
      { locale: 'en', url: 'https://p/en.vtt' },
      { locale: 'fr', url: 'https://clip/fr.vtt' }, // overridden
    ])
  })

  it('drops empty urls from both sources and sorts by locale', () => {
    const merged = mergeSubtitles({ ru: '', en: 'https://p/en.vtt' }, [{ locale: 'de', url: '' }])

    expect(merged).toEqual([{ locale: 'en', url: 'https://p/en.vtt' }])
  })
})

describe('resolveLecture', () => {
  it('resolves a full lecture from its own metadata', () => {
    const resolved = resolveLecture(makeLecture({ type: 'full', metadata: FULL_METADATA }))

    expect(resolved).toEqual({
      id: 1,
      type: 'full',
      title: 'The Subtle System',
      hlsUrl: 'https://cdn.nv/full.m3u8',
      thumbnailUrl: 'https://cdn.nv/thumb.jpg',
      duration: 3600,
      startTime: null,
      stopTime: null,
      subtitles: [
        { locale: 'en', url: 'https://cdn.nv/en.vtt' },
        { locale: 'fr', url: 'https://cdn.nv/fr.vtt' },
      ],
    })
  })

  it('prefers the editor-set title over the metadata title', () => {
    const resolved = resolveLecture(
      makeLecture({ type: 'full', title: 'Custom Title', metadata: FULL_METADATA }),
    )

    expect(resolved.title).toBe('Custom Title')
  })

  it('resolves a clip from its parent metadata, applying its own window', () => {
    const clip = makeLecture({
      id: 2,
      type: 'clip',
      title: 'A Clip',
      metadata: null,
      startTime: 60,
      stopTime: 180,
      fullLecture: makeLecture({ id: 1, type: 'full', metadata: FULL_METADATA }),
    })

    const resolved = resolveLecture(clip)

    expect(resolved.id).toBe(2)
    expect(resolved.type).toBe('clip')
    expect(resolved.hlsUrl).toBe('https://cdn.nv/full.m3u8') // inherited
    expect(resolved.duration).toBe(3600) // inherited (whole-source)
    expect(resolved.startTime).toBe(60)
    expect(resolved.stopTime).toBe(180)
    expect(resolved.subtitles).toEqual([
      { locale: 'en', url: 'https://cdn.nv/en.vtt' },
      { locale: 'fr', url: 'https://cdn.nv/fr.vtt' },
    ])
  })

  it('lets clip subtitle overrides win over inherited parent tracks', () => {
    const clip = makeLecture({
      id: 3,
      type: 'clip',
      metadata: null,
      subtitles: [{ locale: 'fr', url: 'https://clip/fr.vtt' }],
      fullLecture: makeLecture({ id: 1, type: 'full', metadata: FULL_METADATA }),
    })

    expect(resolveLecture(clip).subtitles).toEqual([
      { locale: 'en', url: 'https://cdn.nv/en.vtt' },
      { locale: 'fr', url: 'https://clip/fr.vtt' }, // clip override
    ])
  })

  it('degrades to a null hlsUrl when a clip parent is an unpopulated id', () => {
    const clip = makeLecture({
      id: 4,
      type: 'clip',
      metadata: null,
      fullLecture: 99, // bare id (e.g. preview at insufficient depth)
    })

    const resolved = resolveLecture(clip)

    expect(resolved.hlsUrl).toBeNull()
    expect(resolved.thumbnailUrl).toBeNull()
    expect(resolved.subtitles).toEqual([])
  })

  it('prefers a lecture thumbnail override over the metadata thumbnailUrl', () => {
    const resolved = resolveLecture(
      makeLecture({
        type: 'full',
        metadata: FULL_METADATA,
        thumbnail: { id: 5, url: 'https://cms/override.jpg' } as Lecture['thumbnail'],
      }),
    )

    expect(resolved.thumbnailUrl).toBe('https://cms/override.jpg')
  })
})
