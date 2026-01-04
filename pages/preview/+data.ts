/**
 * Data fetching for preview mode - supports multiple content types (pages, meditations, etc.)
 *
 * This endpoint handles SahajCloud live preview for any collection type.
 * Uses LayoutDefault (full chrome with Header/Footer) which requires WeMeditateWebSettings.
 *
 * URL Parameters:
 * - collection: Collection name (e.g., "pages", "meditations")
 * - id: Document ID to preview
 *
 * Adding a new content type:
 * 1. Add to PREVIEW_FETCHERS object below
 * 2. Add to the discriminated union types in _components/types.ts
 * 3. Add rendering logic in +Page.tsx
 */

import type { PageContextServer } from 'vike/types'
import { getPageById, getMeditationById, getWeMeditateWebSettings } from '../../server/cms-client'
import { render } from 'vike/abort'
import { type CollectionType, type FullPreviewData } from './_components'

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
export type PreviewPageData = FullPreviewData

export async function data(pageContext: PageContextServer): Promise<PreviewPageData> {
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

  // Fetch WeMeditateWebSettings (required for LayoutDefault with Header/Footer)
  const settings = await getWeMeditateWebSettings()

  // Fetch content using the collection-specific fetcher
  // Always bypass cache in preview mode to ensure fresh data
  const data = await fetchById({
    id,
    locale,
    bypassCache: true,  // Always fetch fresh data in preview mode
    draft: true,  // Fetch draft documents for live preview
  })

  if (!data) {
    // Content not found - this is a valid 404 state, not an error
    throw render(404, `${collection} content not found.`)
  }

  // Return discriminated union based on collection type
  return {
    collection: collection as CollectionType,
    initialData: data,
    locale,
    settings,
  } as PreviewPageData
}
