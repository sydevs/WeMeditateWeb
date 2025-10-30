/**
 * Data fetching for pages in default locale (English) with Cloudflare KV caching.
 */

import type { PageContextServer } from 'vike/types'
import { Page } from '../../server/graphql-types'
import { getPageById } from '../../server/graphql-client'
import { render } from 'vike/abort'

export interface PreviewPageData {
  initialData: Page
  locale: string
}

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

  // Let errors throw - they'll be caught by ErrorBoundary
  const page = await getPageById({
    id,
    locale,
    apiKey: import.meta.env.PAYLOAD_API_KEY,
    endpoint: import.meta.env.PUBLIC_ENV__PAYLOAD_URL + '/api/graphql',
  })

  if (!page) {
    // Page not found - this is a valid 404 state, not an error
    throw render(404, "Page not found.")
  }

  return {
    initialData: page,
    locale,
  }
}
