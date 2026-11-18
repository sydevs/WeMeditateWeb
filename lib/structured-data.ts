/**
 * JSON-LD nodes for the site's content routes.
 *
 * Every builder returns a plain object typed against `schema-dts`, so a
 * misspelled `@type` or a property schema.org does not define is a compile
 * error rather than markup a validator rejects after deploy. `schema-dts`
 * is types-only: nothing here reaches the browser as code.
 *
 * ⚠ **Emit a field only when SahajCloud returned it.** A `datePublished` or an
 * `image` invented to fill a slot is a claim about the document, and a wrong
 * one is worse to a crawler than an absent one. Every builder drops an
 * absent value rather than defaulting it.
 *
 * `lib/content-seo.ts` chooses which nodes a route contributes. This module
 * only knows how one node is shaped.
 */

import type {
  Article,
  AudioObject,
  BreadcrumbList,
  ItemList,
  Organization,
  Thing,
  VideoObject,
  WebPage,
  WebSite,
} from 'schema-dts'

/** A rung of a breadcrumb trail. A rung with no URL of its own omits `url`. */
export interface Breadcrumb {
  name: string
  url?: string
}

/** One entry of a listing page's `ItemList`. */
export interface ListEntry {
  name: string
  url: string
}

/**
 * An ISO 8601 duration, as schema.org's `duration` expects.
 *
 * Whole minutes render as `PT20M` rather than `PT1200S`: both are valid, and
 * the first is what a meditation's own `durationMinutes` means.
 */
export function isoDuration(seconds: number): string | null {
  const total = Math.round(seconds)

  if (!Number.isFinite(total) || total <= 0) {
    return null
  }

  const parts = [
    [Math.floor(total / 3600), 'H'],
    [Math.floor((total % 3600) / 60), 'M'],
    [total % 60, 'S'],
  ] as const

  return `PT${parts
    .filter(([value]) => value > 0)
    .map(([value, unit]) => `${value}${unit}`)
    .join('')}`
}

export function organizationNode(options: {
  name: string
  url: string
  logo: string
  sameAs: readonly string[]
}): Organization {
  return {
    '@type': 'Organization',
    name: options.name,
    url: options.url,
    logo: options.logo,
    sameAs: [...options.sameAs],
  }
}

export function webSiteNode(options: {
  name: string
  url: string
  description?: string | null
}): WebSite {
  return {
    '@type': 'WebSite',
    name: options.name,
    url: options.url,
    ...(options.description ? { description: options.description } : {}),
  }
}

export function webPageNode(options: {
  name: string
  url: string
  description?: string | null
  image?: string | null
}): WebPage {
  return {
    '@type': 'WebPage',
    name: options.name,
    url: options.url,
    ...(options.description ? { description: options.description } : {}),
    ...(options.image ? { image: options.image } : {}),
  }
}

export function articleNode(options: {
  headline: string
  url: string
  description?: string | null
  image?: string | null
  authorName?: string | null
  datePublished?: string | null
}): Article {
  return {
    '@type': 'Article',
    headline: options.headline,
    mainEntityOfPage: options.url,
    ...(options.description ? { description: options.description } : {}),
    ...(options.image ? { image: options.image } : {}),
    ...(options.authorName ? { author: { '@type': 'Person', name: options.authorName } } : {}),
    ...(options.datePublished ? { datePublished: options.datePublished } : {}),
  }
}

export function breadcrumbNode(trail: readonly Breadcrumb[]): BreadcrumbList {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((rung, index) => ({
      '@type': 'ListItem' as const,
      position: index + 1,
      name: rung.name,
      ...(rung.url ? { item: rung.url } : {}),
    })),
  }
}

export function audioObjectNode(options: {
  name: string
  url: string
  thumbnailUrl?: string | null
  durationSeconds?: number | null
}): AudioObject {
  const duration = options.durationSeconds == null ? null : isoDuration(options.durationSeconds)

  return {
    '@type': 'AudioObject',
    name: options.name,
    url: options.url,
    ...(options.thumbnailUrl ? { thumbnailUrl: options.thumbnailUrl } : {}),
    ...(duration ? { duration } : {}),
  }
}

export function videoObjectNode(options: {
  name: string
  url: string
  thumbnailUrl?: string | null
  durationSeconds?: number | null
  uploadDate?: string | null
}): VideoObject {
  const duration = options.durationSeconds == null ? null : isoDuration(options.durationSeconds)

  return {
    '@type': 'VideoObject',
    name: options.name,
    url: options.url,
    ...(options.thumbnailUrl ? { thumbnailUrl: options.thumbnailUrl } : {}),
    ...(duration ? { duration } : {}),
    ...(options.uploadDate ? { uploadDate: options.uploadDate } : {}),
  }
}

export function itemListNode(entries: readonly ListEntry[]): ItemList {
  return {
    '@type': 'ItemList',
    itemListElement: entries.map((entry, index) => ({
      '@type': 'ListItem' as const,
      position: index + 1,
      name: entry.name,
      url: entry.url,
    })),
  }
}

/**
 * One `<script type="application/ld+json">` body: every node of a page under
 * a single `@context`.
 *
 * ⚠ **`<` is escaped to `<`.** The sink is a `<script>` block carrying
 * SahajCloud-authored text, where a literal `</script>` inside a string would
 * close the block and turn the rest of the document into markup. JSON's
 * `\u` escape round-trips to the same character, so a parser reads the
 * original text and `isSafeJsonLd` (lib/head.tsx) finds nothing to refuse.
 *
 * Returns the empty string for no nodes, which is what suppresses the tag.
 */
export function serializeJsonLd(nodes: readonly Thing[]): string {
  if (nodes.length === 0) {
    return ''
  }

  const document = { '@context': 'https://schema.org', '@graph': nodes }

  return JSON.stringify(document).replace(/</g, '\\u003c')
}
