/** Data fetching for pages in default locale (English). */

import type { PageContextServer } from 'vike/types'
import type { Locale, Page, WebConfig } from '../../server/sahajcloud-types'
import { DEFAULT_LOCALE } from '../../server/sahajcloud-types'
import { getPageBySlug, getPageLocaleStatus } from '../../server/sahajcloud-client'
import { loadLivePreview, previewArgs } from '../../server/live-preview'
import { loadSiteContext } from '../../server/site-context'
import { advertisedLocales } from '../../lib/hreflang'
import { pageTagLabels } from '../../lib/page-tag-labels'
import { resolveContentIndexBlocks } from '../../server/content-index'
import { slugSchema } from '../../server/validation'
import { localePath, normalizeContentPath } from '../../lib/urls'
import { redirect, render } from 'vike/abort'

export interface PageData {
  page: Page
  settings: WebConfig
  locale: Locale
  slug: string
  /**
   * The locales this page advertises in its `hreflang` cluster: published
   * in SahajCloud and offered by the site. Empty means "no translations", and
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

  const preview = await loadLivePreview(pageContext)
  const site = loadSiteContext(pageContext)

  // `/` (routed as "index" by +onBeforeRoute) serves the config's home page,
  // so its slug is known only once the config is in. It is then read, and
  // advertises its locales, exactly as the page at its own slug would.
  let pageSlug = slug

  if (slug === 'index') {
    const { homePage } = (await site).settings

    if (!homePage) {
      throw render(404, 'Homepage not configured.')
    }
    pageSlug = homePage.slug
  }

  // Fetch the config, the page, and its per-locale publish state together.
  // The status read needs only the slug, so making it wait on the other two
  // would add a round trip to TTFB for a `<head>` annotation.
  const [{ settings, t }, page, status] = await Promise.all([
    site,
    getPageBySlug({ slug: pageSlug, locale, ...previewArgs(preview) }),
    getPageLocaleStatus({ slug: pageSlug }),
  ])

  // `homePage` is served at `/`, so its own slug is a second URL for one
  // document. That slug is empty today, but an editor can fill it in, so the
  // answer comes from the config rather than from the emptiness holding.
  //
  // 302, not `/index`'s 301: a routing spelling is permanent, an editor's
  // slug is not, and a cached 301 would outlive a `homePage` change.
  //
  // ⚠ Never for `index`, which is `/` itself after `+onBeforeRoute`. A home
  // page an editor slugged `index` would otherwise redirect `/` to `/`, and
  // the site's front page would answer only a redirect loop.
  if (slug !== 'index' && settings.homePage?.slug && slug === settings.homePage.slug) {
    throw redirect(localePath(locale, '/'), 302)
  }

  if (!page) {
    // A page not translated into the reader's language yet lands on the
    // English one, and becomes their own language the moment an editor
    // publishes the translation. One rule for every language.
    //
    // 302, not 301: that publish has to change where the URL lands, and a
    // 301 is cached indefinitely. `advertisedLocales` is asked rather than
    // `status` indexed, because English must be both published upstream and
    // offered by this site — a locale the site does not offer has no URL to
    // point at, and `server/site-context.ts` would 404 the target too. A
    // failed status read answers `{}`, which advertises nothing, so the 404
    // below stands rather than guessing the English page is there.
    if (
      locale !== DEFAULT_LOCALE &&
      advertisedLocales(status, settings.availableLocales).includes(DEFAULT_LOCALE)
    ) {
      throw redirect(localePath(DEFAULT_LOCALE, normalizeContentPath(`/${slug}`)), 302)
    }

    // Page not found. This is a valid 404 state, not an error.
    throw render(404, 'Page not found.')
  }
  // Resolve any content-index blocks' live lists for SSR.
  const content = await resolveContentIndexBlocks(page.content, {
    locale,
    audiences: settings.audiences,
    pageTagLabels: pageTagLabels(t),
  })

  return {
    page: { ...page, content },
    locale,
    slug,
    settings,
    alternateLocales: advertisedLocales(status, settings.availableLocales),
  }
}
