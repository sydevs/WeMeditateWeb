import { describe, it, expect } from 'vitest'
import { partitionPublishedPages } from './cms-client'
import type { Page } from './cms-types'

const page = (id: number, slug: string): Page => ({ id, slug, title: 'T' }) as unknown as Page

describe('partitionPublishedPages', () => {
  it('keeps published pages with a slug; flags bare IDs (unpublished) and slugless objects', () => {
    const { published, unresolved } = partitionPublishedPages([
      page(10, 'meditate-now'),
      7, // unpublished page → CMS returns a bare id instead of a populated object
      page(99, ''), // populated but no slug → can't form a link
    ])

    expect(published.map((p) => p.slug)).toEqual(['meditate-now'])
    expect(unresolved).toEqual(['id:7', 'id:99(no-slug)'])
  })

  it('treats null/undefined as empty', () => {
    expect(partitionPublishedPages(null)).toEqual({ published: [], unresolved: [] })
    expect(partitionPublishedPages(undefined)).toEqual({ published: [], unresolved: [] })
  })

  it('keeps every page when all are published', () => {
    const { published, unresolved } = partitionPublishedPages([page(1, 'a'), page(2, 'b')])

    expect(published).toHaveLength(2)
    expect(unresolved).toEqual([])
  })
})
