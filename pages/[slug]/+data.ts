/**
 * Data fetching for pages in default locale (English) with Cloudflare KV caching.
 */

import type { PageContextServer } from 'vike/types'
import { Page, WeMeditateWebSettings } from '../../server/graphql-types'
import { getPageBySlug, getWeMeditateWebSettings } from '../../server/graphql-client'
import { render } from 'vike/abort'

export interface PageData {
  page: Page
  settings: WeMeditateWebSettings
  locale: string
  slug: string
}

export async function data(pageContext: PageContextServer): Promise<PageData> {
  const {
    cloudflare,
    locale,
    routeParams: { slug },
  } = pageContext

  // Access Cloudflare KV namespace for caching
  const kv = cloudflare?.env?.WEMEDITATE_CACHE

  // Fetch WeMeditateWebSettings
  const settings = await getWeMeditateWebSettings({
    apiKey: import.meta.env.PAYLOAD_API_KEY,
    endpoint: import.meta.env.PUBLIC__PAYLOAD_URL + '/api/graphql',
    kv,
  })

  // Let errors throw - they'll be caught by ErrorBoundary
  const page = await getPageBySlug({
    slug,
    locale,
    apiKey: import.meta.env.PAYLOAD_API_KEY,
    endpoint: import.meta.env.PUBLIC__PAYLOAD_URL + '/api/graphql',
    kv,
  })

  if (!page) {
    // Page not found - this is a valid 404 state, not an error
    throw render(404, "Page not found.")
  }

  return {
    page,
    locale,
    slug,
    settings,
  }
}
