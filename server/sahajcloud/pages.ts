/**
 * Reads a page by slug, and the locales it is published in.
 */

import { createPayloadClient } from './payload-client'
import { withRetry } from '@/server/error-utils'
import * as Sentry from '@sentry/cloudflare'
import type { Locale, Page, PageStatus } from '@/types/sahajcloud'
import { DOCUMENT_READ_DEPTH } from './documents'
import { LocalizedQueryOptions, withRetryUnlessPreview } from './query'
import { PAGE_POPULATE, PAGE_SELECT, PAGE_STATUS_SELECT } from './selects'

/**
 * Retrieves a specific page by slug and locale.
 *
 * @param options - Query options
 * @param options.slug - The page slug to search for
 * @param options.locale - The locale to retrieve the page in
 * @returns The page data or null if not found
 */
export async function getPageBySlug(
  options: LocalizedQueryOptions & {
    slug: string
    preview?: boolean
    previewToken?: string
  },
): Promise<Page | null> {
  const isPreview = options.preview === true

  return withRetryUnlessPreview(
    async () => {
      const client = createPayloadClient({
        preview: isPreview,
        previewToken: options.previewToken,
      })

      const result = await client.find({
        collection: 'pages',
        where: {
          slug: { equals: options.slug },
        },
        locale: options.locale,
        // ⚠ Under `draft: true` Payload matches the DRAFT version's slug, so a
        // draft that renames its slug is reachable at its new URL — which is
        // exactly the URL SahajCloud's `buildPageWebPath` composes for the
        // panel. The two agreeing is not a coincidence; it is why the panel
        // and the site share one composer.
        draft: isPreview,
        limit: 1,
        // Depth 3 so relationships embedded in `content` blocks (showcase,
        // subtle-system) resolve their own thumbnails. The narrow
        // per-collection selects in PAGE_POPULATE keep this small.
        depth: DOCUMENT_READ_DEPTH,
        select: PAGE_SELECT,
        populate: PAGE_POPULATE,
      })

      if (!result?.docs?.length) {
        return null
      }

      const page = result.docs[0] as Page

      // Belt and braces for the public path: an API key cannot read drafts
      // without a live-preview credential, so this should be unreachable. Under
      // preview it is exactly what we asked for.
      if (!isPreview && page._status === 'draft') {
        return null
      }

      return page
    },
    { preview: isPreview },
  )
}

/**
 * One page's per-locale publish state, `{ en: 'published', de: 'draft' }`,
 * for `advertisedLocales` to turn into an `hreflang` cluster.
 *
 * A **second, locale-agnostic read** beside the content read, not a
 * replacement for it. `locale: 'all'` turns every localized field into a
 * `{ locale: value }` map, which every consumer of `Page` would have to
 * unpick; this read selects `_status` alone, so the content read keeps its
 * ordinary single-locale shape. It sends no locale, so every locale of a
 * page issues the same URL and shares one edge entry.
 *
 * Returns `{}` — never `null` — for a page that is missing or has no
 * status, so `advertisedLocales` has a map to walk either way.
 *
 * Degrades to `{}` on failure, after a single attempt. The page content is
 * already in hand by then, and retrying for seconds to decorate the head
 * would cost more than the decoration is worth.
 *
 * The one cast sits here, at the boundary where `locale: 'all'` is applied:
 * the generated `Page._status` spells the field as the plain string a
 * single-locale read returns, and this is the only read that asks for the
 * map. `advertisedLocales` keeps its own runtime guard regardless — the
 * sitemap hands it a `_status` straight off a generated document type, and
 * meditations and lectures really do return a string or nothing there.
 */
export async function getPageLocaleStatus(options: {
  slug: string
}): Promise<Partial<Record<Locale, PageStatus>>> {
  try {
    return await withRetry(
      async () => {
        const client = createPayloadClient()

        const result = await client.find({
          collection: 'pages',
          where: { slug: { equals: options.slug } },
          locale: 'all',
          limit: 1,
          depth: 0,
          select: PAGE_STATUS_SELECT,
        })

        return (result?.docs?.[0]?._status ?? {}) as Partial<Record<Locale, PageStatus>>
      },
      // The page content is already in hand when this read fails, so the
      // default 3-attempt backoff would stall TTFB to decorate a `<head>`.
      { maxAttempts: 1 },
    )
  } catch (error) {
    console.warn(`[getPageLocaleStatus] no cluster for "${options.slug}":`, error)
    Sentry.captureMessage('Per-locale publish state read failed; emitting no hreflang cluster', {
      level: 'warning',
      tags: { source: 'getPageLocaleStatus' },
      extra: { slug: options.slug },
    })

    return {}
  }
}
