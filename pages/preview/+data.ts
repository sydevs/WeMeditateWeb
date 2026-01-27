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
import { idSchema, collectionSchema } from '../../server/validation'

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
  const { search: { collection: collectionParam, id: idParam } } = pageContext.urlParsed
  const { locale } = pageContext

  // Validate required parameters
  if (!collectionParam) {
    throw render(404, 'Missing "collection" parameter')
  }

  if (!idParam) {
    throw render(404, 'Missing "id" parameter')
  }

  // Validate collection type with Zod
  let collection: CollectionType
  try {
    collection = collectionSchema.parse(collectionParam)
  } catch (error) {
    const supported = collectionSchema.options.join(', ')
    throw render(404, `Invalid collection: "${collectionParam}". Supported types: ${supported}`)
  }

  // Validate ID parameter with Zod (numeric ID)
  let id: string
  try {
    id = idSchema.parse(idParam)
  } catch (error) {
    throw render(404, error instanceof Error ? error.message : 'Invalid ID')
  }

  const fetchById = PREVIEW_FETCHERS[collection]

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
