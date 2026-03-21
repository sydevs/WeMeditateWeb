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
 * - secret: Preview secret for authentication (required)
 */

import type { PageContextServer } from 'vike/types'
import { getDocumentById } from '../../../server/cms-client'
import { render } from 'vike/abort'
import { type CollectionType, type BasePreviewData } from '../_components'
import { idSchema, collectionSchema } from '../../../server/validation'

// Re-export for use in +Page.tsx
export type EmbedPreviewPageData = BasePreviewData

export async function data(pageContext: PageContextServer): Promise<EmbedPreviewPageData> {
  // Extract URL parameters
  const { search: { collection: collectionParam, id: idParam, secret: previewSecret } } = pageContext.urlParsed
  const { locale } = pageContext

  // Preview secret is required — the CMS includes it in the iframe URL
  if (!previewSecret) {
    throw render(403, 'Missing preview secret')
  }

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

  // NOTE: Unlike /preview, we do NOT fetch WeMeditateWebSettings here
  // because LayoutEmbed doesn't require them (no Header/Footer)

  // Fetch content using the generic document fetcher
  // Always bypass cache in preview mode to ensure fresh data
  const data = await getDocumentById({
    collection,
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
