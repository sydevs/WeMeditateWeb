/**
 * Data fetching for pages in default locale (English) with Cloudflare KV caching.
 */

import type { PageContextServer } from 'vike/types'
// import { getPageBySlug } from '@/lib/queries/pages'
// import type { PageData as PageType } from '@/lib/queries/pages'

export interface PageData {
  // page: PageType | null
  locale: string
  slug: string
}

export async function data(pageContext: PageContextServer) {
  const {
    locale,
    routeParams: { slug },
  } = pageContext

  return {
    locale,
    slug,
  }
}

// export async function data(pageContext: PageContextServer) {
//   const {
//     cloudflare,
//     locale,
//     routeParams: { slug },
//   } = pageContext

//   // Access Cloudflare KV namespace
//   const kv = cloudflare?.env?.WEMEDITATE_CACHE

//   // Let errors throw - they'll be caught by ErrorBoundary
//   const page = await getPageBySlug(slug, locale, { kv })

//   if (!page) {
//     // Page not found - this is a valid 404 state, not an error
//     return {
//       page: null,
//       locale,
//       slug,
//     }
//   }

//   return {
//     page,
//     locale,
//     slug,
//   }
// }
