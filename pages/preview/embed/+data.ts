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
 * - secret: Preview secret for authentication
 */

import type { PageContextServer } from 'vike/types'
import { getDocumentById } from '../../../server/cms-client'
import { render } from 'vike/abort'
import { type CollectionType, type BasePreviewData } from '../_components'

// Re-export for use in +Page.tsx
export type EmbedPreviewPageData = BasePreviewData

export async function data(pageContext: PageContextServer): Promise<EmbedPreviewPageData> {
  // Extract URL parameters
  const { search: { collection, id, secret: previewSecret } } = pageContext.urlParsed
  const { locale } = pageContext

  // Preview secret is required — the CMS includes it in the iframe URL
  if (!previewSecret) {
    throw render(403, 'Missing preview secret')
  }

  // Validate required parameters
  if (!collection) {
    throw new Error('Preview error: Missing "collection" parameter')
  }

  if (!id) {
    throw new Error('Preview error: Missing "id" parameter')
  }

  // Validate collection type
  const validCollections: CollectionType[] = ['pages', 'meditations']
  if (!validCollections.includes(collection as CollectionType)) {
    throw new Error(
      `Preview error: Unsupported collection type "${collection}". ` +
      `Supported types: ${validCollections.join(', ')}`
    )
  }

  // NOTE: Unlike /preview, we do NOT fetch WeMeditateWebSettings here
  // because LayoutEmbed doesn't require them (no Header/Footer)

  // Fetch content using the generic document fetcher
  // Always bypass cache in preview mode to ensure fresh data
  const data = await getDocumentById({
    collection: collection as CollectionType,
    id,
    locale,
    preview: true,
    previewSecret,
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
