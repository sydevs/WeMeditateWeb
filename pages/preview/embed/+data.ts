/**
 * Data fetching for embed preview mode - supports all content types
 *
 * This endpoint is similar to /preview but uses LayoutEmbed (no Header/Footer).
 * Unlike /preview, this does NOT fetch WeMeditateWebSettings since LayoutEmbed
 * doesn't require them.
 *
 * URL Parameters:
 * - collection: Collection name (e.g., "pages", "meditations")
 * - id: Document ID to preview
 */

import type { PageContextServer } from 'vike/types'
import { getPageById, getMeditationById } from '../../../server/cms-client'
import { render } from 'vike/abort'
import { type CollectionType, type BasePreviewData } from '../_components'

/**
 * Registry mapping collection names to their REST API fetcher functions
 *
 * NOTE: This is defined locally in +data.ts (server-only) rather than in
 * _components/ to avoid bundling server code in client bundles.
 */
const PREVIEW_FETCHERS = {
  pages: getPageById,
  meditations: getMeditationById,
} as const

// Re-export for use in +Page.tsx
export type EmbedPreviewPageData = BasePreviewData

export async function data(pageContext: PageContextServer): Promise<EmbedPreviewPageData> {
  // Extract URL parameters
  const { search: { collection, id } } = pageContext.urlParsed
  const { locale } = pageContext

  // Validate required parameters
  if (!collection) {
    throw new Error('Preview error: Missing "collection" parameter')
  }

  if (!id) {
    throw new Error('Preview error: Missing "id" parameter')
  }

  // Validate collection type
  if (!(collection in PREVIEW_FETCHERS)) {
    const supported = Object.keys(PREVIEW_FETCHERS).join(', ')
    throw new Error(
      `Preview error: Unsupported collection type "${collection}". ` +
      `Supported types: ${supported}`
    )
  }

  const fetchById = PREVIEW_FETCHERS[collection as CollectionType]

  // NOTE: Unlike /preview, we do NOT fetch WeMeditateWebSettings here
  // because LayoutEmbed doesn't require them (no Header/Footer)

  // Fetch content using the collection-specific fetcher
  // Always bypass cache in preview mode to ensure fresh data
  const data = await fetchById({
    id,
    locale,
    bypassCache: true,
    draft: true,  // Fetch draft documents for live preview
  })

  if (!data) {
    throw render(404, `${collection} content not found.`)
  }

  // Return discriminated union based on collection type
  return {
    collection: collection as CollectionType,
    initialData: data,
    locale,
  } as EmbedPreviewPageData
}
