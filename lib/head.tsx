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
import { buildAlternates, type Alternate } from './hreflang'
import { localeUrl, normalizeContentPath } from './urls'
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
 * One `<link rel="alternate" hreflang>` per row of a cluster.
 *
 * The single owner of how an alternate is spelled, used by the content
 * pages here and by `/map` in `lib/atlas-head.tsx`. The two clusters are
 * built very differently — content alternates are path prefixes, atlas
 * alternates are `?locale=` query variants — but they are rendered
 * identically, and a spelling that drifted between them would annotate
 * half the site one way and half the other.
 *
 * Rendered as a component, instead of assembled as strings, so React does
 * the ordinary attribute escaping on every value.
 */
export function HreflangLinks({ alternates }: { alternates: readonly Alternate[] }) {
  return (
    <>
      {alternates.map((alternate) => (
        // The lowercase spelling is spread in deliberately. React emits the
        // `hrefLang` prop as authored, and while an HTML parser lowercases
        // attribute names anyway, these tags exist for other crawlers to
        // read, and some of them pattern-match instead of parsing.
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
 * The `<link>` tags a content URL contributes: its own canonical, then its
 * cluster.
 *
 * The canonical is always emitted. An `hreflang` cluster whose members are
 * not self-canonical is one Google discards, so the two ship together.
 */
export function ContentHeadTags({
  canonical,
  alternates,
}: {
  canonical: string
  alternates: readonly Alternate[]
}) {
  return (
    <>
      <link href={canonical} rel="canonical" />
      <HreflangLinks alternates={alternates} />
    </>
  )
}

/**
 * The canonical and `hreflang` cluster for whichever content route is
 * rendering. Declared as `Head: ContentHead` in a route's `+config.ts`,
 * beside its `Layout: LayoutChrome`.
 *
 * That is the level this belongs at. "This route is an indexable content
 * URL" is route identity, exactly like "this route wears the site chrome",
 * and a new content route opts in with one declarative line instead of
 * remembering a hook call. It is also why this is not set from a template:
 * `PageTemplate`, `MeditationTemplate` and `LectureTemplate` are shared
 * with the `embed` routes and the live preview, and none of those is a URL
 * to point a crawler at.
 *
 * `alternateLocales` comes off the route's data (`pages/[slug]/+data.ts`).
 * A route that publishes none — a meditation or a lecture, neither of which
 * carries per-locale publish state upstream — advertises nothing and gets
 * its canonical alone.
 *
 * Renders nothing at all when the origin is unknown, which is the case
 * outside a Vike app. A guessed canonical is worse than none.
 */
export function ContentHead() {
  const pageContext = useOptionalPageContext()
  const origin = pageContext?.urlParsed?.origin

  if (!origin) {
    return null
  }

  // ⚠ A live preview is not a URL to point a crawler at — the repo convention
  // that kept `ContentHead` out of the templates in the first place, because
  // they are shared with the `embed` routes and with preview.
  //
  // Preview used to be its own route, which declared no `Head` at all. Now it
  // is the real route with a token on it, so the suppression has to happen
  // here instead. Without it, previewing a DRAFT page emits a canonical and a
  // full hreflang cluster pointing at a URL that 404s publicly — and under
  // `draft: true` the alternates would advertise unpublished locales too.
  //
  // `X-Robots-Tag: noindex` also rides the response, but a canonical is a
  // claim about another URL and is worth not making at all.
  if (pageContext.livePreview?.active) {
    return null
  }

  const path = normalizeContentPath(pageContext.urlPathname)
  const { locale } = pageContext
  const { alternateLocales } = (pageContext.data ?? {}) as { alternateLocales?: readonly Locale[] }

  return (
    <ContentHeadTags
      alternates={buildAlternates({ origin, path, locales: alternateLocales ?? [] })}
      canonical={localeUrl(origin, locale, path)}
    />
  )
}
