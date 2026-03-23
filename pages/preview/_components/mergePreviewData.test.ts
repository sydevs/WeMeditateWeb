import { describe, expect, it } from 'vitest'
import { mergePreviewData } from './mergePreviewData'

interface PreviewShape {
  id: number
  title?: string
  thumbnail?: { id: number; url: string } | number | null
  narrator?: { id: number; name: string } | number | null
  nested?: {
    description?: string
    audioUrl?: string
  }
}

describe('mergePreviewData', () => {
  it('preserves base values when the live payload omits them', () => {
    const base: PreviewShape = {
      id: 12,
      title: 'Morning Meditation',
      nested: {
        description: 'Settling in',
        audioUrl: '/media/audio.mp3',
      },
    }

    const incoming: PreviewShape = {
      id: 12,
      nested: {
        description: 'Settling in deeply',
      },
    }

    expect(mergePreviewData(base, incoming)).toEqual({
      id: 12,
      title: 'Morning Meditation',
      nested: {
        description: 'Settling in deeply',
        audioUrl: '/media/audio.mp3',
      },
    })
  })

  it('keeps populated relationships when the live payload collapses them to the same ID', () => {
    const base: PreviewShape = {
      id: 12,
      title: 'Morning Meditation',
      thumbnail: {
        id: 44,
        url: '/media/thumb.webp',
      },
      narrator: {
        id: 7,
        name: 'Mataji',
      },
    }

    const incoming: PreviewShape = {
      id: 12,
      title: 'Updated Title',
      thumbnail: 44,
      narrator: 7,
    }

    expect(mergePreviewData(base, incoming)).toEqual({
      id: 12,
      title: 'Updated Title',
      thumbnail: {
        id: 44,
        url: '/media/thumb.webp',
      },
      narrator: {
        id: 7,
        name: 'Mataji',
      },
    })
  })

  it('allows relationship changes through when the ID changes', () => {
    const base: PreviewShape = {
      id: 12,
      thumbnail: {
        id: 44,
        url: '/media/thumb.webp',
      },
    }

    const incoming: PreviewShape = {
      id: 12,
      thumbnail: 99,
    }

    expect(mergePreviewData(base, incoming)).toEqual({
      id: 12,
      thumbnail: 99,
    })
  })

  it('allows null to clear a field', () => {
    const base: PreviewShape = {
      id: 12,
      thumbnail: {
        id: 44,
        url: '/media/thumb.webp',
      },
    }

    const incoming: PreviewShape = {
      id: 12,
      thumbnail: null,
    }

    expect(mergePreviewData(base, incoming)).toEqual({
      id: 12,
      thumbnail: null,
    })
  })
})
