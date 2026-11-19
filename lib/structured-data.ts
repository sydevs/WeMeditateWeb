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
 * one is worse to a crawler than an absent one. `compact` is where that
 * happens, once, for every builder.
 *
 * `lib/content-seo.ts` chooses which nodes a route contributes. This module
 * only knows how one node is shaped.
 */

import type {
  Article,
  AudioObject,
  BreadcrumbList,
  ItemList,
  ListItem,
  Organization,
  Thing,
  VideoObject,
  WebPage,
  WebSite,
} from 'schema-dts'

/**
 * The module's one rule, in one place: a field SahajCloud did not answer is
 * left out of the node rather than emitted as `null`.
 *
 * `Nullable` is what lets a builder hand an upstream `string | null` straight
 * to the field it belongs to, so no builder restates the rule per field.
 */
type Nullable<T> = { [K in keyof T]: T[K] | null | undefined }

function compact<T extends object>(node: Nullable<T>): T {
  return Object.fromEntries(
    Object.entries(node).filter(([, value]) => value != null && value !== ''),
  ) as T
}

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
  return compact<WebSite>({
    '@type': 'WebSite',
    name: options.name,
    url: options.url,
    description: options.description,
  })
}

export function webPageNode(options: {
  name: string
  url: string
  description?: string | null
  image?: string | null
}): WebPage {
  return compact<WebPage>({
    '@type': 'WebPage',
    name: options.name,
    url: options.url,
    description: options.description,
    image: options.image,
  })
}

export function articleNode(options: {
  headline: string
  url: string
  description?: string | null
  image?: string | null
  authorName?: string | null
  datePublished?: string | null
}): Article {
  return compact<Article>({
    '@type': 'Article',
    headline: options.headline,
    mainEntityOfPage: options.url,
    description: options.description,
    image: options.image,
    author: options.authorName ? { '@type': 'Person', name: options.authorName } : null,
    datePublished: options.datePublished,
  })
}

export function breadcrumbNode(trail: readonly Breadcrumb[]): BreadcrumbList {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((rung, index) =>
      compact<ListItem>({
        '@type': 'ListItem',
        position: index + 1,
        name: rung.name,
        item: rung.url,
      }),
    ),
  }
}

export function audioObjectNode(options: {
  name: string
  url: string
  thumbnailUrl?: string | null
  durationSeconds?: number | null
}): AudioObject {
  const duration = options.durationSeconds == null ? null : isoDuration(options.durationSeconds)

  return compact<AudioObject>({
    '@type': 'AudioObject',
    name: options.name,
    url: options.url,
    thumbnailUrl: options.thumbnailUrl,
    duration,
  })
}

/**
 * No `uploadDate`: nothing upstream stores one. `LectureMetadata` carries
 * `lastSyncedAt`, which is when we read the lecture, not when it was
 * published, and a wrong date is worse than an absent one.
 */
export function videoObjectNode(options: {
  name: string
  url: string
  thumbnailUrl?: string | null
  durationSeconds?: number | null
}): VideoObject {
  const duration = options.durationSeconds == null ? null : isoDuration(options.durationSeconds)

  return compact<VideoObject>({
    '@type': 'VideoObject',
    name: options.name,
    url: options.url,
    thumbnailUrl: options.thumbnailUrl,
    duration,
  })
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
