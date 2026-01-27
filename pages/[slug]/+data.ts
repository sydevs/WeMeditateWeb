/**
 * Data fetching for pages in default locale (English) with Cloudflare KV caching.
 */

import type { PageContextServer } from 'vike/types'
import type { Page, WeMeditateWebSettings } from '../../server/cms-types'
import { getPageBySlug, getWeMeditateWebSettings } from '../../server/cms-client'
import { slugSchema } from '../../server/validation'
import { render } from 'vike/abort'

export interface PageData {
  page: Page
  settings: WeMeditateWebSettings
  locale: string
  slug: string
}

export async function data(pageContext: PageContextServer): Promise<PageData> {
  const { locale, routeParams } = pageContext

  // Validate slug parameter - returns 404 for invalid slugs
  let slug: string
  try {
    slug = slugSchema.parse(routeParams.slug)
  } catch (error) {
    throw render(404, error instanceof Error ? error.message : 'Invalid slug')
  }

  // Fetch WeMeditateWebSettings and page by slug
  const [settings, page] = await Promise.all([
    getWeMeditateWebSettings(),
    getPageBySlug({ slug, locale }),
  ])

  if (!page) {
    // Page not found - this is a valid 404 state, not an error
    throw render(404, 'Page not found.')
  }

  return {
    page,
    locale,
    slug,
    settings,
  }
}
