/**
 * Reads one document by collection and id, in the shape the server render and the live-preview
 * populate proxy both ask for.
 */

import { createPayloadClient } from './payload-client'
import { readStatus } from '@/lib/errors/error-type'
import type { Config } from '@/types/payload/payload-types'
import { LocalizedQueryOptions, withRetryUnlessPreview } from './query'
import {
  IMAGE_POPULATE,
  LECTURE_POPULATE,
  LECTURE_SELECT,
  MEDITATION_SELECT,
  PAGE_POPULATE,
  PAGE_SELECT,
} from './selects'

/**
 * Configuration for collections that support findById queries.
 * Maps PayloadCMS collection slugs to the select/populate shapes required
 * by the backend query-validation hook.
 */
const COLLECTION_BY_ID_CONFIG = {
  pages: {
    select: PAGE_SELECT,
    populate: PAGE_POPULATE,
  },
  meditations: {
    select: MEDITATION_SELECT,
    populate: IMAGE_POPULATE,
  },
  lectures: {
    select: LECTURE_SELECT,
    populate: LECTURE_POPULATE,
  },
} as const

type FindByIdCollection = keyof typeof COLLECTION_BY_ID_CONFIG

/**
 * The depth every single-document read asks for, and the one live preview's
 * populate proxy has to repeat.
 *
 * Named rather than written twice because a third caller now depends on the
 * number: `/api/live-preview/populate` re-runs this read shape against the
 * unsaved document, and a proxy reading shallower than the render would drop
 * exactly the relationships an editor is watching.
 */
export const DOCUMENT_READ_DEPTH = 3

/** True for a collection `documentReadArgs` can answer for. */
export function isDocumentCollection(value: string): value is FindByIdCollection {
  return Object.hasOwn(COLLECTION_BY_ID_CONFIG, value)
}

/**
 * The depth / select / populate one document read sends, for a caller that is
 * not `getDocumentById`.
 *
 * Only live preview's populate proxy is such a caller. SahajCloud rejects an
 * API-client read with no `select` (400) and a depth > 1 read with no
 * `populate` (400, both verified against production), so the round trip cannot
 * simply forward what Payload's SDK sends. It also PRUNES the answer to
 * `select`, so a shape that disagreed with the render would hand the template
 * a document missing the fields it renders.
 */
export function documentReadArgs(collection: FindByIdCollection): {
  depth: number
  select: Record<string, unknown>
  populate: Record<string, unknown>
} {
  const config = COLLECTION_BY_ID_CONFIG[collection]

  return {
    depth: DOCUMENT_READ_DEPTH,
    select: config.select,
    populate: config.populate,
  }
}

/**
 * Retrieves a document by ID from any configured collection.
 *
 * This is a generic function that handles pages, meditations, and any future
 * collection types that support findById queries. It supports preview mode
 * for trusted draft previews.
 *
 * ⚠ An id the collection does not hold is `null`, not a throw. The SDK
 * answers `findByID` with a 404, and letting it escape rendered the 500 page
 * for a stale inbound link or a deleted document — against this function's
 * own contract, which every caller reads as `null`. The retry ladder is not
 * what it cost: a 404 classifies as CLIENT, so `withRetry` already refused it.
 *
 * @param options - Query options
 * @param options.collection - The PayloadCMS collection slug
 * @param options.id - The document ID to retrieve
 * @param options.locale - The locale to retrieve the document in
 * @param options.preview - If true, fetch draft data with trusted preview credentials
 * @returns The document data or null if not found
 */
export async function getDocumentById<C extends FindByIdCollection>(
  options: LocalizedQueryOptions & {
    collection: C
    id: string
    preview?: boolean
    previewToken?: string
  },
): Promise<Config['collections'][C] | null> {
  const config = COLLECTION_BY_ID_CONFIG[options.collection]
  const isPreview = options.preview === true

  return withRetryUnlessPreview(
    async () => {
      const client = createPayloadClient({
        preview: isPreview,
        previewToken: options.previewToken,
      })

      let found: unknown

      try {
        found = await client.findByID({
          collection: options.collection,
          id: options.id,
          locale: options.locale,
          // Depth 3 to resolve relationships embedded in `content` blocks (see
          // `getPageBySlug` in ./pages). The per-collection selects in
          // PAGE_POPULATE bound this.
          depth: DOCUMENT_READ_DEPTH,
          draft: isPreview,
          // select/populate are validated per-collection where they are defined
          // in ./selects (PAGE_SELECT / MEDITATION_SELECT via `satisfies`). TypeScript cannot
          // correlate the union-typed config to the generic collection `C`. The
          // input is cast here. The response is re-typed to the concrete doc below.
          select: config.select as never,
          populate: config.populate as never,
        })
      } catch (error) {
        if (readStatus(error) === 404) return null

        throw error
      }

      const result = found as Config['collections'][C] | null

      if (!result) return null
      // Public requests must never render a draft. A collection with no
      // draft/version support (for example lectures) has no `_status` and
      // is always live. Filter only where the field actually exists.
      const status = (result as { _status?: string })._status

      if (!isPreview && status === 'draft') return null

      return result
    },
    { preview: isPreview },
  )
}
