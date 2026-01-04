/**
 * Data fetching for preview mode - supports multiple content types (pages, meditations, etc.)
 *
 * This endpoint handles SahajCloud live preview for any collection type.
 *
 * URL Parameters:
 * - collection: Collection name (e.g., "pages", "meditations")
 * - id: Document ID to preview
 *
 * Adding a new content type:
 * 1. Add to PREVIEW_FETCHERS object below
 * 2. Add to PreviewPageData discriminated union
 * 3. Add rendering logic in +Page.tsx
 */

import type { PageContextServer } from 'vike/types'
import type { Page, Meditation, WeMeditateWebSettings } from '../../server/cms-types'
import { getPageById, getMeditationById, getWeMeditateWebSettings } from '../../server/cms-client'
import { render } from 'vike/abort'

/**
 * Discriminated union for preview data based on collection type
 */
export type PreviewPageData =
  | {
      collection: 'pages'
      initialData: Page
      locale: string
      settings: WeMeditateWebSettings
    }
  | {
      collection: 'meditations'
      initialData: Meditation
      locale: string
      settings: WeMeditateWebSettings
    }

/**
 * Registry mapping collection names to their REST API fetcher functions
 */
const PREVIEW_FETCHERS = {
  pages: getPageById,
  meditations: getMeditationById,
} as const

type CollectionType = keyof typeof PREVIEW_FETCHERS

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

  // Fetch WeMeditateWebSettings (shared across all content types)
  const settings = await getWeMeditateWebSettings()

  // Fetch content using the collection-specific fetcher
  // Always bypass cache in preview mode to ensure fresh data
  const data = await fetchById({
    id,
    locale,
    bypassCache: true,  // Always fetch fresh data in preview mode
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
