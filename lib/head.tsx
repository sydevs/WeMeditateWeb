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
 *
 * `useConfig` emits `title` / `description` / `image` and nothing else, so
 * the canonical and the `hreflang` cluster go through `Head` instead — the
 * mechanism `lib/atlas-head.tsx` already uses for `/map`. There is one
 * head mechanism here, not two.
 */

import { useConfig } from 'vike-react/useConfig'
import { getImageURL, getVariantName, isCloudflareImageURL } from './cloudflare-images'
import { populatedImageUrl } from './cms-relationships'
import { useOptionalPageContext, useT } from '../hooks/useT'
import {
  buildAlternates,
  normalizeContentPath,
  localeUrl,
  type Alternate,
} from './hreflang'
import type { Locale } from '../server/cms-types'

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

/**
 * The `<link>` tags a content URL contributes: its own canonical, then one
 * `rel="alternate"` row per advertised locale.
 *
 * Rendered as a component, instead of assembled as strings, so React does
 * the ordinary attribute escaping on every value — the same reason
 * `AtlasHeadTags` is one.
 *
 * The canonical comes first and is always emitted. An `hreflang` cluster
 * whose members are not self-canonical is one Google discards, so the two
 * belong in the same array and ship together.
 */
export function ContentHeadTags({
  canonical,
  alternates,
}: {
  canonical: string
  alternates: Alternate[]
}) {
  return (
    <>
      <link href={canonical} rel="canonical" />

      {alternates.map((alternate) => (
        // The lowercase spelling is spread in deliberately. React emits
        // the `hrefLang` prop as authored, and while an HTML parser
        // lowercases attribute names anyway, these tags exist for other
        // crawlers to read, and some of them pattern-match instead of
        // parsing. Same reasoning as `lib/atlas-head.tsx:74-78`.
        <link
          key={alternate.hreflang}
          rel="alternate"
          {...{ hreflang: alternate.hreflang }}
          href={alternate.href}
        />
      ))}
    </>
  )
}

/**
 * Sets a content URL's canonical and `hreflang` cluster during render.
 *
 * This is a hook, so call it unconditionally from a component. Call it from
 * the route's `+Page.tsx`, never from a template: the templates are shared
 * with the `embed` routes and the live preview, and neither of those is a
 * URL a crawler should be pointed at.
 *
 * `alternateLocales` is the set the document may advertise — see
 * `advertisedLocales`. An empty set (the default) emits the canonical
 * alone, which is the honest annotation for a document with no per-locale
 * publish state.
 *
 * Contributes nothing at all when the origin is unknown, which is the case
 * outside a Vike app (Ladle, a bare unit render). A guessed canonical is
 * worse than none.
 */
export function useContentHead(options: { alternateLocales?: readonly Locale[] } = {}): void {
  const config = useConfig()
  const pageContext = useOptionalPageContext()

  const origin = pageContext?.urlParsed?.origin
  const locale = (pageContext?.locale ?? 'en') as Locale

  if (!origin) {
    return
  }

  const path = normalizeContentPath(pageContext?.urlPathname)
  const alternates = buildAlternates({
    origin,
    path,
    locales: options.alternateLocales ?? [],
  })

  config({
    // ⚠ An array, even for one element — `Head` is a cumulative config and
    // vike-react spreads it at render time. A bare element throws
    // `((intermediate value) ?? []) is not iterable` and 500s the page.
    // See the full note in `lib/atlas-head.tsx`.
    Head: [
      <ContentHeadTags
        alternates={alternates}
        canonical={localeUrl(origin, locale, path)}
        key="content-head"
      />,
    ],
  })
}
