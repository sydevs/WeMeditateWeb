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
import { useT } from '../hooks/useT'

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
 * This is a hook, so call it unconditionally from a component.
 *
 * Each tag falls through three levels: the page's own CMS `meta`, then the
 * site defaults from the CMS (`common.general.site_title` /
 * `site_description`, in the page's locale), then the English literals in
 * `pages/+config.ts`. Before the middle level existed, a French page with
 * no meta of its own advertised itself in English to search engines and
 * social previews.
 */
export function usePageHead(options: {
  meta?: PageMetaLike | null
  fallbackTitle?: string | null
}): void {
  const config = useConfig()
  const t = useT()
  const { meta, fallbackTitle } = options

  const title = meta?.title || fallbackTitle || t('common.general.site_title') || undefined
  const description = meta?.description || t('common.general.site_description') || undefined
  const image = resolveOgImageUrl(meta?.image) || undefined

  config({
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
  })
}
