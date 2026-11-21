/**
 * Reads the `wm-web-config` global, and keeps only the nav pages that are published.
 */

import { createPayloadClient } from './payload-client'
import { warnOnce } from '@/server/error-utils'
import type { Locale, NavPage, WebConfig } from '@/types/sahajcloud'
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/locales'
import { withRetryUnlessPreview } from './query'
import { WEB_CONFIG_POPULATE, WEB_CONFIG_SELECT } from './selects'

/**
 * Splits a page-relationship array into published, linkable pages (populated
 * objects with a slug) and unresolved references. A relationship is
 * unresolved when it returns as a bare ID (believed unpublished or trashed:
 * a published page populates, an unpublished one returns as just its ID) or
 * as an object with no slug.
 *
 * The published side is {@link NavPage}, not `Page`: `NAV_PAGE_SELECT` is what
 * the config read asks for, so nothing outside it arrives.
 */
export function partitionPublishedPages(pages: (number | NavPage)[] | null | undefined): {
  published: NavPage[]
  unresolved: string[]
} {
  const published: NavPage[] = []
  const unresolved: string[] = []

  for (const page of pages ?? []) {
    if (typeof page === 'object' && page && typeof page.slug === 'string' && page.slug.length > 0) {
      published.push(page)
    } else {
      unresolved.push(typeof page === 'object' && page ? `id:${page.id}(no-slug)` : `id:${page}`)
    }
  }

  return { published, unresolved }
}

/**
 * Gets the WebConfig (site configuration).
 *
 * This singleton global holds references to important pages across the
 * site: the home page, featured pages, class pages, and more.
 *
 * This function drops unresolved page references (believed unpublished), so
 * the layout never renders a dead `/undefined` link, and reports each drop
 * to Sentry so the underlying SahajCloud data gap stays visible.
 *
 * This global has no drafts, so there is no preview variant to read. It
 * carried a `preview` flag only to bypass a 24 h KV entry; the edge cache
 * that replaced it expires within 600s on its own, so an editor sees a nav
 * or home-page change without one. The upstream purge-on-write only
 * shortens that wait — see CACHING.md, it is best-effort.
 *
 * @returns The web configuration with populated page relationships
 */
export async function getWebConfig(options: { locale?: Locale } = {}): Promise<WebConfig> {
  return withRetryUnlessPreview(async () => {
    const client = createPayloadClient()

    const config = await client.findGlobal({
      slug: 'wm-web-config',
      depth: 2,
      locale: options.locale,
      select: WEB_CONFIG_SELECT,
      populate: WEB_CONFIG_POPULATE,
    })

    // Drop unresolved (believed-unpublished) page references, so the
    // layout never renders a dead `/undefined` link.
    const featured = partitionPublishedPages(config.featuredPages)
    const featuredArticles = partitionPublishedPages(config.featuredArticles)
    const classPages = partitionPublishedPages(config.classPages)
    const knowledgePages = partitionPublishedPages(config.knowledgePages)
    const infoPages = partitionPublishedPages(config.infoPages)

    const unresolved = [
      ...(typeof config.homePage === 'number' ? [`homePage id:${config.homePage}`] : []),
      ...featured.unresolved.map((u) => `featuredPages ${u}`),
      ...featuredArticles.unresolved.map((u) => `featuredArticles ${u}`),
      ...classPages.unresolved.map((u) => `classPages ${u}`),
      ...knowledgePages.unresolved.map((u) => `knowledgePages ${u}`),
      ...infoPages.unresolved.map((u) => `infoPages ${u}`),
    ]

    // Report the data gap to Sentry without breaking the page. A published
    // page populates. An unpublished one returns as a bare id.
    if (unresolved.length > 0) {
      console.warn(
        `[getWebConfig] ${unresolved.length} unpublished/unresolved page reference(s): ${unresolved.join(', ')}`,
      )

      // ⚠ This is the one warning in the repo that fires on healthy traffic:
      // a standing gap would bill a Sentry event per page view, so `warnOnce`
      // bounds the volume and `console.warn` above keeps every occurrence.
      // The locale is the render that first saw the gap, not the only one hit.
      warnOnce(unresolved.join(','), 'WebConfig references unpublished or unresolved pages', {
        source: 'getWebConfig',
        extra: { unresolved, locale: options.locale ?? null },
      })
    }

    // An unconfigured global offers English only. Never return an empty
    // set: `loadSiteContext` 404s any locale outside it, so an empty
    // array would 404 the whole site, English included.
    const availableLocales = (config.availableLocales ?? []).filter(isLocale)

    return {
      ...config,
      availableLocales: availableLocales.length > 0 ? availableLocales : [DEFAULT_LOCALE],
      // A bare id is an unpublished home page, logged above. Passed through it
      // would render `/` blank with a 200; `null` lets the route 404.
      homePage: typeof config.homePage === 'object' ? config.homePage : null,
      featuredPages: featured.published,
      featuredArticles: featuredArticles.published,
      classPages: classPages.published,
      knowledgePages: knowledgePages.published,
      infoPages: infoPages.published,
    } as WebConfig
  })
}
