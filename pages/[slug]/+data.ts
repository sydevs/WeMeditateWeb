/**
 * Data fetching for pages in default locale (English) with Cloudflare KV caching.
 */

import type { PageContextServer } from 'vike/types'
import type { Page, WebConfig } from '../../server/cms-types'
import { getPageBySlug, getWebConfig } from '../../server/cms-client'
import { resolveContentIndexBlocks } from '../../server/content-index'
import { slugSchema } from '../../server/validation'
import { render } from 'vike/abort'

export interface PageData {
  page: Page
  settings: WebConfig
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

  // Homepage (slug "index") uses homePage from WebConfig directly.
  // The onBeforeRoute hook converts "/" to "/index", so this is the homepage path.
  if (slug === 'index') {
    const settings = await getWebConfig({ locale })

    if (!settings.homePage) {
      throw render(404, 'Homepage not configured.')
    }
    const content = await resolveContentIndexBlocks(settings.homePage.content, {
      locale,
      audiences: settings.audiences,
    })

    return { page: { ...settings.homePage, content }, locale, slug, settings }
  }

  // Non-homepage: fetch WebConfig and page by slug in parallel
  const [settings, page] = await Promise.all([
    getWebConfig({ locale }),
    getPageBySlug({ slug, locale }),
  ])

  if (!page) {
    // Page not found - this is a valid 404 state, not an error
    throw render(404, 'Page not found.')
  }
  // Resolve any content-index blocks' live lists for SSR.
  const content = await resolveContentIndexBlocks(page.content, {
    locale,
    audiences: settings.audiences,
  })

  return { page: { ...page, content }, locale, slug, settings }
}
