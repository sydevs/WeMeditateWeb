/**
 * Data fetching for pages in default locale (English) with Cloudflare KV caching.
 */

import type { PageContextServer } from 'vike/types'
import type { Locale, Page, WebConfig } from '../../server/cms-types'
import { getPageBySlug, getPageAdvertisedLocales } from '../../server/cms-client'
import { loadSiteContext } from '../../server/site-context'
import { pageTagLabels } from '../../lib/page-tag-labels'
import { resolveContentIndexBlocks } from '../../server/content-index'
import { slugSchema } from '../../server/validation'
import { render } from 'vike/abort'

export interface PageData {
  page: Page
  settings: WebConfig
  locale: string
  slug: string
  /**
   * The locales this page advertises in its `hreflang` cluster: published
   * in the CMS and offered by the site. Empty means "no translations", and
   * the page then emits its canonical alone.
   */
  alternateLocales: Locale[]
}

export async function data(pageContext: PageContextServer): Promise<PageData> {
  const { locale, routeParams } = pageContext

  // Validate the slug parameter. Return 404 for an invalid slug.
  let slug: string

  try {
    slug = slugSchema.parse(routeParams.slug)
  } catch (error) {
    throw render(404, error instanceof Error ? error.message : 'Invalid slug')
  }

  // Homepage (slug "index") uses homePage from WebConfig directly.
  // The onBeforeRoute hook converts "/" to "/index", so this is the homepage path.
  if (slug === 'index') {
    const { settings, t } = await loadSiteContext(pageContext)

    if (!settings.homePage) {
      throw render(404, 'Homepage not configured.')
    }
    // The home page advertises the locales of the document behind it, not
    // of the `/index` route.
    const [content, alternateLocales] = await Promise.all([
      resolveContentIndexBlocks(settings.homePage.content, {
        locale,
        audiences: settings.audiences,
        pageTagLabels: pageTagLabels(t),
      }),
      getPageAdvertisedLocales({
        slug: settings.homePage.slug,
        offered: settings.availableLocales,
      }),
    ])

    return { page: { ...settings.homePage, content }, locale, slug, settings, alternateLocales }
  }

  // Non-homepage: fetch WebConfig and page by slug in parallel
  const [{ settings, t }, page] = await Promise.all([
    loadSiteContext(pageContext),
    getPageBySlug({ slug, locale }),
  ])

  if (!page) {
    // Page not found. This is a valid 404 state, not an error.
    throw render(404, 'Page not found.')
  }
  // Resolve any content-index blocks' live lists for SSR, and read which
  // locales this page is published in. The `hreflang` read is the one read
  // this annotation adds, and it runs alongside work already happening.
  const [content, alternateLocales] = await Promise.all([
    resolveContentIndexBlocks(page.content, {
      locale,
      audiences: settings.audiences,
      pageTagLabels: pageTagLabels(t),
    }),
    getPageAdvertisedLocales({ slug, offered: settings.availableLocales }),
  ])

  return { page: { ...page, content }, locale, slug, settings, alternateLocales }
}
