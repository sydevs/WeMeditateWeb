import { describe, it, expect, vi } from 'vitest'
import { getPageBySlug, partitionPublishedPages } from './cms-client'
import { createPayloadClient } from './payload-client'
import type { Page } from './cms-types'

// Stub the SDK factory so we can capture the query, and the cache so the
// fetch function runs synchronously without KV.
vi.mock('./payload-client', () => ({
  createPayloadClient: vi.fn(),
  validateSDKResponse: (value: unknown) => value,
}))
vi.mock('./kv-cache', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./kv-cache')>()

  return { ...actual, withCache: (opts: { fetchFn: () => unknown }) => opts.fetchFn() }
})

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

describe('getPageBySlug query shape', () => {
  it('reads at depth 3 with narrow per-collection populate for embedded relations', async () => {
    const find = vi.fn().mockResolvedValue({
      docs: [{ id: 1, slug: 'chakras-channels', _status: 'published' }],
    })

    vi.mocked(createPayloadClient).mockReturnValue({ find } as never)

    await getPageBySlug({ slug: 'chakras-channels', locale: 'en' })

    const args = find.mock.calls[0][0]

    expect(args.collection).toBe('pages')
    expect(args.depth).toBe(3)
    // Embedded content relationships are populated narrowly...
    expect(Object.keys(args.populate)).toEqual(
      expect.arrayContaining(['pages', 'meditations', 'lectures', 'albums', 'app-cards', 'images']),
    )
    // ...and the embedded page select omits the heavy `content` field.
    expect(args.populate.pages.slug).toBe(true)
    expect(args.populate.pages.content).toBeUndefined()
  })
})
