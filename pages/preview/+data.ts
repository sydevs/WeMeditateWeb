/**
 * Data fetching for pages in default locale (English) with Cloudflare KV caching.
 */

import type { PageContextServer } from 'vike/types'
import { Page, WeMeditateWebSettings } from '../../server/graphql-types'
import { getPageById, getWeMeditateWebSettings } from '../../server/graphql-client'
import { render } from 'vike/abort'

export interface PreviewPageData {
  initialData: Page
  locale: string
  settings: WeMeditateWebSettings
}

export async function data(pageContext: PageContextServer): Promise<PreviewPageData> {
  // Extract URL parameters
  const { search: { collection, id } } = pageContext.urlParsed
  const { cloudflare, locale } = pageContext

  // Validate required parameters
  if (!collection) {
    throw new Error('Preview error: Missing "collection" parameter')
  }

  if (!id) {
    throw new Error('Preview error: Missing "id" parameter')
  }

  // Fetch WeMeditateWebSettings
  const settings = await getWeMeditateWebSettings({
    apiKey: import.meta.env.PAYLOAD_API_KEY,
    endpoint: import.meta.env.PUBLIC_ENV__PAYLOAD_URL + '/api/graphql',
    kv: cloudflare?.env?.WEMEDITATE_CACHE,
  })

  // Let errors throw - they'll be caught by ErrorBoundary
  // Use bypassCache: true for preview mode to ensure fresh data
  const page = await getPageById({
    id,
    locale,
    apiKey: import.meta.env.PAYLOAD_API_KEY,
    endpoint: import.meta.env.PUBLIC_ENV__PAYLOAD_URL + '/api/graphql',
    kv: cloudflare?.env?.WEMEDITATE_CACHE,
    bypassCache: true,  // Always fetch fresh data in preview mode
  })

  if (!page) {
    // Page not found - this is a valid 404 state, not an error
    throw render(404, "Page not found.")
  }

  return {
    initialData: page,
    locale,
    settings,
  }
}
