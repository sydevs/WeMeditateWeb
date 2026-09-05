/**
 * Data fetching for preview mode. Supports multiple content types (pages,
 * meditations, and more).
 *
 * This endpoint handles SahajCloud live preview for any collection type.
 * It uses LayoutChrome (full chrome, with Header and Footer), which needs
 * WeMeditateWebSettings.
 *
 * URL parameters:
 * - collection: collection name (for example, "pages", "meditations")
 * - id: document ID to preview
 * - secret: preview secret for authentication (required)
 *
 * To add a new content type:
 * 1. Add it to COLLECTION_BY_ID_CONFIG in server/cms-client.ts
 * 2. Add it to collectionSchema in server/validation.ts
 * 3. Add it to the discriminated union types in _components/types.ts
 * 4. Add a <Collection>Preview component and a case in _components/Preview.tsx
 */

import type { PageContextServer } from 'vike/types'
import { getDocumentById, getMeditationSongs, getWebConfig } from '../../../server/cms-client'
import { resolveContentIndexBlocks } from '../../../server/content-index'
import { render } from 'vike/abort'
import { type CollectionType, type FullPreviewData } from '../_components'
import { idSchema, collectionSchema } from '../../../server/validation'

// Re-export for use in +Page.tsx
export type PreviewPageData = FullPreviewData

export async function data(pageContext: PageContextServer): Promise<PreviewPageData> {
  // Extract URL parameters
  const {
    search: { collection: collectionParam, id: idParam, secret: previewSecret },
  } = pageContext.urlParsed
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

  // Fetch WeMeditateWebSettings (required for LayoutChrome with Header/Footer)
  const settings = await getWebConfig({ locale })

  // Fetch content with the generic document fetcher.
  // Always bypass the cache in preview mode, for fresh data.
  const data = await getDocumentById({
    collection,
    id,
    locale,
    preview: true,
    previewSecret,
  })

  if (!data) {
    // Content not found. This is a valid 404 state, not an error.
    throw render(404, `${collection} content not found.`)
  }

  // Resolve content-index blocks so any content-bearing collection (currently
  // pages) renders its live lists in preview too.
  if (data && typeof data === 'object' && 'content' in data) {
    const withContent = data as { content?: unknown }

    withContent.content = await resolveContentIndexBlocks(withContent.content, {
      locale,
      preview: true,
      audiences: settings.audiences,
    })
  }

  // Background music for meditation previews. This keeps the live player
  // in sync with the published routes (other collections have none).
  // Related content is not fetched here. The preview page renders it
  // client-side, like the live routes (RelatedContentLoader), because the
  // ranking endpoints are slow.
  const musicTracks = collection === 'meditations' ? await getMeditationSongs({ id, locale }) : []

  // Return discriminated union based on collection type
  return {
    collection: collection as CollectionType,
    initialData: data,
    locale,
    musicTracks,
    settings,
  } as PreviewPageData
}
