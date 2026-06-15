import { describe, it, expect, vi, beforeEach } from 'vitest'

// Provide CMS config without a request context, run the fetch synchronously
// (no KV), and silence Sentry warnings on the degrade paths.
vi.mock('./cms-context', () => ({
  getCmsContext: () => ({ apiKey: 'test-key', baseURL: 'https://cms.test', kv: undefined }),
}))
vi.mock('./kv-cache', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./kv-cache')>()

  return { ...actual, withCache: (opts: { fetchFn: () => unknown }) => opts.fetchFn() }
})
vi.mock('@sentry/react', () => ({ captureMessage: vi.fn() }))

import { resolveContentIndexItems, resolveContentIndexBlocks } from './content-index'
import type { ContentIndexBlockFields } from '../lib/cms-blocks'

const jsonResponse = (docs: unknown[]) => ({ ok: true, json: async () => ({ docs }) }) as never

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('resolveContentIndexItems', () => {
  it('appends select/locale to the computed endpoint and maps pages to cards', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse([{ id: 2, slug: 'about', title: 'About' }]))

    const items = await resolveContentIndexItems(
      { type: 'pages', limit: 10, apiEndpoint: '/api/pages?where[tags][in]=wisdom&limit=10' },
      { locale: 'en' },
    )

    expect(items).toHaveLength(1)
    expect(items[0].href).toBe('/about')

    const url = fetchSpy.mock.calls[0][0] as string

    expect(url).toContain('https://cms.test/api/pages?where[tags][in]=wisdom&limit=10')
    expect(url).toContain('select[title]=true')
    expect(url).toContain('locale=en')

    const init = fetchSpy.mock.calls[0][1] as RequestInit
    const auth = (init.headers as Record<string, string>).Authorization

    expect(auth).toContain('API-Key test-key')
  })

  it('caps the result at the block limit', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse([
        { id: 1, slug: 'a', title: 'A' },
        { id: 2, slug: 'b', title: 'B' },
        { id: 3, slug: 'c', title: 'C' },
      ]),
    )

    const items = await resolveContentIndexItems(
      { type: 'pages', limit: 2, apiEndpoint: '/api/pages?limit=2' },
      {},
    )

    expect(items).toHaveLength(2)
  })

  it('degrades to [] on a non-200 (e.g. lectures needing runtime audiences)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 400 } as never)

    const items = await resolveContentIndexItems(
      { type: 'lectures', limit: 100, apiEndpoint: '/api/lectures/for-audience?limit=100' },
      {},
    )

    expect(items).toEqual([])
  })

  it('returns [] when the block has no apiEndpoint', async () => {
    expect(await resolveContentIndexItems({ type: 'pages', limit: 10 }, {})).toEqual([])
  })
})

describe('resolveContentIndexBlocks', () => {
  it('attaches resolvedItems on a clone without mutating the input', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse([{ id: 2, slug: 'about', title: 'About' }]),
    )

    const content = {
      root: {
        children: [
          {
            type: 'block',
            fields: {
              blockType: 'content-index',
              id: 'ci1',
              type: 'pages',
              limit: 10,
              apiEndpoint: '/api/pages?limit=10',
            },
          },
          { type: 'block', fields: { blockType: 'quote', id: 'q', text: 'hi' } },
        ],
      },
    }

    const resolved = await resolveContentIndexBlocks(content, { locale: 'en' })

    // The original (cached) object is never mutated.
    const original = content.root.children[0].fields as ContentIndexBlockFields

    expect(original.resolvedItems).toBeUndefined()

    const cloned = (resolved as typeof content).root.children[0].fields as ContentIndexBlockFields

    expect(cloned.resolvedItems).toHaveLength(1)
    expect(cloned.resolvedItems?.[0].href).toBe('/about')
  })

  it('returns the same content untouched when there are no content-index blocks', async () => {
    const content = {
      root: { children: [{ type: 'block', fields: { blockType: 'quote', id: 'q', text: 'hi' } }] },
    }

    expect(await resolveContentIndexBlocks(content, {})).toBe(content)
  })
})
