/**
 * SEO `<head>` helpers for content pages.
 *
 * Uses vike-react's `useConfig` to set `title` / `description` / `image` from a
 * page's CMS `meta`. Vike turns these into the corresponding tags:
 *   title       → <title>, <meta property="og:title">
 *   description → <meta name="description">, <meta property="og:description">
 *   image       → <meta property="og:image">, <meta name="twitter:card">
 *
 * See https://vike.dev/useConfig and https://vike.dev/title
 */

import { useConfig } from 'vike-react/useConfig'
import { getImageURL, getVariantName, isCloudflareImageURL } from './cloudflare-images'
import { populatedImageUrl } from './cms-relationships'

/** Minimal shape of a page's `meta` field (a subset of the CMS Page meta). */
export interface PageMetaLike {
  title?: string | null
  description?: string | null
  /** Image relationship: a populated upload doc, a bare id, or null. */
  image?: number | { url?: string | null } | null
}

/**
 * Resolves a `meta.image` relationship to a single absolute og:image URL.
 *
 * og:image needs one large landscape render, so this function appends a
 * `video` (16:9) variant to a Cloudflare Images URL. A bare
 * imagedelivery.net URL does not resolve without one. Returns null when
 * the image is missing or unpopulated (a bare id), so the tag is simply
 * omitted.
 */
export function resolveOgImageUrl(image: PageMetaLike['image']): string | null {
  const url = populatedImageUrl(image)

  if (!url) {
    return null
  }

  return isCloudflareImageURL(url) ? getImageURL(url, getVariantName('video', 'large')) : url
}

/**
 * Sets the page's SEO head tags from CMS meta, during render.
 *
 * This is a hook, so call it unconditionally from a component. It falls
 * back to the page title when `meta.title` is absent. It omits any tag
 * whose value is missing, so the global defaults in `pages/+config.ts` apply.
 */
export function usePageHead(options: {
  meta?: PageMetaLike | null
  fallbackTitle?: string | null
}): void {
  const config = useConfig()
  const { meta, fallbackTitle } = options

  const title = meta?.title || fallbackTitle || undefined
  const description = meta?.description || undefined
  const image = resolveOgImageUrl(meta?.image) || undefined

  config({
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
  })
}
