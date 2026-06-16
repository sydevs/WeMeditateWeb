/**
 * Server-side pre-resolution for `content-index` blocks.
 *
 * A `content-index` block carries a CMS-computed virtual `apiEndpoint` (path +
 * filters + limit) describing the live list it should show. The endpoint can't
 * be fetched verbatim by an API client — collection reads require a `select`,
 * and the lectures `/for-audience` endpoint needs runtime audience context — so
 * here we take the computed endpoint, append the `select`/`locale`/`depth` the
 * backend requires, fetch it (cached), and attach the resulting cards to the
 * block so the renderer can display them synchronously during SSR.
 *
 * Anything we can't resolve (lectures without audiences, a failed fetch)
 * degrades to an empty list — the block renders nothing rather than breaking.
 */

import * as Sentry from '@sentry/react'
import { getCmsContext } from './cms-context'
import { withCache, generateCacheKey, CacheTTL } from './kv-cache'
import type { Locale } from './cms-types'
import {
  contentIndexCard,
  type ContentIndexBlockFields,
  type ResolvedCardItem,
} from '../lib/cms-blocks'

/** Per-type field selection appended to the computed endpoint (the backend
 * rejects API-client collection reads without a `select`). */
const SELECT_BY_TYPE: Record<ContentIndexBlockFields['type'], string> = {
  pages: 'select[title]=true&select[slug]=true&select[meta]=true',
  meditations: 'select[title]=true&select[thumbnail]=true&select[durationMinutes]=true',
  songs: 'select[title]=true&select[album]=true',
  lectures: 'select[title]=true&select[thumbnail]=true',
}

interface ResolveOptions {
  locale?: Locale
  /** Bypass the KV cache (live preview). */
  preview?: boolean
}

/** Fetch and map the live list for a single content-index block. */
export async function resolveContentIndexItems(
  fields: ContentIndexBlockFields,
  options: ResolveOptions = {},
): Promise<ResolvedCardItem[]> {
  const { type, limit, apiEndpoint } = fields

  if (!apiEndpoint) {
    return []
  }
  const { apiKey, baseURL } = getCmsContext()
  const cacheKey = generateCacheKey('content-index', {
    endpoint: apiEndpoint,
    locale: options.locale,
  })

  return withCache({
    cacheKey,
    ttl: CacheTTL.LIST,
    bypassCache: options.preview === true,
    fetchFn: async () => {
      const separator = apiEndpoint.includes('?') ? '&' : '?'
      const select = SELECT_BY_TYPE[type] ?? ''
      const localeParam = options.locale ? `&locale=${options.locale}` : ''
      const url = `${baseURL}${apiEndpoint}${separator}${select}&depth=1${localeParam}`

      try {
        const response = await fetch(url, {
          headers: { Authorization: `clients API-Key ${apiKey}` },
        })

        if (!response.ok) {
          // Lectures (/for-audience) and any malformed endpoint land here.
          Sentry.captureMessage('content-index endpoint not resolvable', {
            level: 'warning',
            tags: { source: 'resolveContentIndexItems' },
            extra: { type, status: response.status },
          })

          return []
        }
        const json = (await response.json()) as { docs?: Record<string, unknown>[] }
        const docs = json.docs ?? []
        const cap = typeof limit === 'number' ? limit : docs.length

        return docs
          .slice(0, cap)
          .map((doc) => contentIndexCard(doc, type))
          .filter((card): card is ResolvedCardItem => card !== null)
      } catch (error) {
        Sentry.captureMessage('content-index fetch failed', {
          level: 'warning',
          tags: { source: 'resolveContentIndexItems' },
          extra: { type, error: error instanceof Error ? error.message : String(error) },
        })

        return []
      }
    },
  })
}

/** Recursively collect every `content-index` block's `fields` object. */
function collectContentIndexBlocks(node: unknown, out: ContentIndexBlockFields[]): void {
  if (Array.isArray(node)) {
    for (const child of node) {
      collectContentIndexBlocks(child, out)
    }

    return
  }
  if (node && typeof node === 'object') {
    const candidate = node as { type?: unknown; fields?: { blockType?: unknown } }

    if (candidate.type === 'block' && candidate.fields?.blockType === 'content-index') {
      out.push(candidate.fields as ContentIndexBlockFields)
    }
    for (const value of Object.values(node)) {
      collectContentIndexBlocks(value, out)
    }
  }
}

/** Short-circuiting check for at least one `content-index` block (avoids
 * cloning content that has none — the common case). */
function hasContentIndexBlock(node: unknown): boolean {
  if (Array.isArray(node)) {
    return node.some(hasContentIndexBlock)
  }
  if (node && typeof node === 'object') {
    const candidate = node as { type?: unknown; fields?: { blockType?: unknown } }

    if (candidate.type === 'block' && candidate.fields?.blockType === 'content-index') {
      return true
    }

    return Object.values(node).some(hasContentIndexBlock)
  }

  return false
}

/**
 * Walk a page's lexical `content`, resolve every `content-index` block's list,
 * and return content with `resolvedItems` attached. The input is left
 * untouched (the cached page object is never mutated); a structural clone is
 * returned only when there is at least one content-index block to resolve.
 */
export async function resolveContentIndexBlocks<T>(
  content: T,
  options: ResolveOptions = {},
): Promise<T> {
  if (!content || typeof content !== 'object' || !hasContentIndexBlock(content)) {
    return content
  }
  // Clone so the (cached) input is never mutated; only reached when there is at
  // least one content-index block to resolve.
  const cloned = structuredClone(content)
  const targets: ContentIndexBlockFields[] = []

  collectContentIndexBlocks(cloned, targets)

  await Promise.all(
    targets.map(async (fields) => {
      fields.resolvedItems = await resolveContentIndexItems(fields, options)
    }),
  )

  return cloned
}
