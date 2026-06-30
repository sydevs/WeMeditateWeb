/**
 * App-side types and pure helpers for the custom Lexical blocks embedded in
 * `pages.content`.
 *
 * The block field shapes are NOT in the generated `payload-types.ts` (the editor
 * stores them loosely as `[k: string]: unknown` inside the lexical tree), so the
 * interfaces here are authored from the upstream SahajCloud block definitions
 * (`src/lib/richEditor/blocks/*`). Keep them in sync with that source.
 *
 * Helpers that turn block fields into component props live here (not in the
 * converters) so they can be unit-tested without rendering.
 */

import type { AppCard, Image, Lecture } from '../server/payload-types'
import type { Meditation, Page } from '../server/cms-types'
import { cmsHref, type RelationValue } from './cms-routes'
import { isPopulated } from './cms-relationships'
import { nearestAspectRatio, type AspectRatio } from './cloudflare-images'

/** A relationship/upload field: a populated document or a bare id. */
export type Ref<T> = number | T

// ============================================================================
// Field shapes (mirror sy-devs SahajCloud `richEditor/blocks/*`)
// ============================================================================

/** `textbox` — TextBoxBlock. */
export interface TextBoxBlockFields {
  image?: Ref<Image> | null
  imagePosition: 'left' | 'right' | 'overlay'
  /** Only meaningful for `imagePosition: 'overlay'`. */
  textPosition?: 'left' | 'right' | 'center'
  /** Only meaningful for `imagePosition: 'overlay'`. */
  textColor?: 'dark' | 'light'
  wisdomStyle?: boolean | null
  title?: string | null
  subtitle?: string | null
  text?: string | null
  buttonText?: string | null
  buttonUrl?: string | null
}

/** `quote` — QuoteBlock. */
export interface QuoteBlockFields {
  title?: string | null
  text: string
  credit?: string | null
  caption?: string | null
}

/** `button` — ButtonBlock. */
export interface ButtonBlockFields {
  text: string
  url: string
}

/** `image-gallery` — ImageGalleryBlock (3–15 uploads). */
export interface ImageGalleryBlockFields {
  items?: Ref<Image>[] | null
}

/** A polymorphic showcase relationship entry. */
export type ShowcaseRelationTo = 'meditations' | 'pages' | 'lectures' | 'app-cards'
export interface ShowcaseItem {
  relationTo: ShowcaseRelationTo
  value: Ref<Meditation | Page | Lecture | AppCard>
}

/** `showcase` — ShowcaseBlock (3–6 polymorphic relationships). */
export interface ShowcaseBlockFields {
  items?: ShowcaseItem[] | null
}

/** `subtle-system` — SubtleSystemBlock (12 single `pages` relationships). */
export interface SubtleSystemBlockFields {
  left?: Ref<Page> | null
  right?: Ref<Page> | null
  center?: Ref<Page> | null
  mooladhara?: Ref<Page> | null
  kundalini?: Ref<Page> | null
  swadhistan?: Ref<Page> | null
  nabhi?: Ref<Page> | null
  void?: Ref<Page> | null
  anahat?: Ref<Page> | null
  vishuddhi?: Ref<Page> | null
  agnya?: Ref<Page> | null
  sahasrara?: Ref<Page> | null
}

/** `splash` — SplashBlock. */
export interface SplashBlockFields {
  layout: 'default' | 'countdown' | 'app' | 'map-search'
  images?: Ref<Image>[] | null
  title?: string | null
  subtitle?: string | null
  actionText?: string | null
  actionURL?: string | null
  /**
   * Describes the *text* color (dark/light), mirroring the `textbox` overlay
   * convention. Not yet authored in the CMS (see SahajCloud ticket) — absent is
   * treated as light text on a dark hero (`theme: 'dark'`).
   */
  textColor?: 'dark' | 'light' | null
}

/** `layout` — LayoutBlock item. */
export interface LayoutItem {
  id?: string
  image?: Ref<Image> | null
  title?: string | null
  titleUrl?: string | null
  text?: string | null
}

/** `layout` — LayoutBlock. */
export interface LayoutBlockFields {
  style: 'grid' | 'tabs' | 'accordion' | 'list' | 'textList'
  title?: string | null
  defaultTab?: string | null
  useColumnsOnDesktop?: boolean | null
  items?: LayoutItem[] | null
}

/** A single entry in a `table-of-contents` block (matches the CMS field). */
export interface TocHeading {
  slug: string
  text: string
  level: number
}

/** `table-of-contents` — TableOfContentsBlock. */
export interface TableOfContentsBlockFields {
  title?: string | null
  headings?: TocHeading[] | null
}

/** `content-index` — ContentIndexBlock. `resolvedItems` is attached by the
 * server-side pre-resolve pass in `+data`; the editor never stores it. */
export interface ContentIndexBlockFields {
  type: 'meditations' | 'pages' | 'songs' | 'lectures'
  limit: number
  /** Virtual field computed by the CMS (path + filters + limit). */
  apiEndpoint?: string | null
  resolvedItems?: ResolvedCardItem[] | null
}

// ============================================================================
// Shared card shape + helpers
// ============================================================================

/** A grid/card item shape, structurally compatible with `ContentGridItem`. */
export interface ResolvedCardItem {
  id: string | number
  title: string
  href: string
  thumbnailSrc: string
  thumbnailAlt?: string
  aspectRatio?: AspectRatio
  playButton?: boolean
  durationMinutes?: number
  badge?: string
}

/** A populated image resolved to the fields the `Image` atom needs. */
export interface PopulatedImage {
  url: string
  alt: string
  width?: number
  height?: number
  /** Nearest configured Cloudflare aspect ratio for the intrinsic dimensions. */
  aspectRatio: AspectRatio
}

/** Resolve an upload/relationship ref to image fields, or `null` if unpopulated. */
export function populatedImage(ref: unknown): PopulatedImage | null {
  if (!isPopulated<Image>(ref) || typeof ref.url !== 'string' || ref.url.length === 0) {
    return null
  }

  return {
    url: ref.url,
    alt: ref.alt ?? '',
    width: ref.width ?? undefined,
    height: ref.height ?? undefined,
    aspectRatio: nearestAspectRatio(ref.width, ref.height),
  }
}

/** Resolve the uploads of an `image-gallery` block to renderable images. */
export function galleryImages(images: ImageGalleryBlockFields['items']): PopulatedImage[] {
  const result: PopulatedImage[] = []

  for (const ref of images ?? []) {
    const img = populatedImage(ref)

    if (img) {
      result.push(img)
    }
  }

  return result
}

/**
 * Invert a CMS `textColor` (which describes the *text*: dark/light) into a
 * background-context `theme` — light text implies a dark background, and vice
 * versa. When `textColor` is absent, fall back to `fallback`. Shared by the
 * splash hero and the `textbox` overlay, which use this same inversion but
 * differ only in their default.
 */
export function textColorToTheme(
  textColor: 'dark' | 'light' | null | undefined,
  fallback: 'light' | 'dark',
): 'light' | 'dark' {
  if (textColor === 'dark') return 'light'
  if (textColor === 'light') return 'dark'

  return fallback
}

/**
 * Derive a Splash background-context theme from its `textColor` field. Defaults
 * to `'dark'` (light text over a dark hero) when the field is absent — the
 * splash's historical hardcoded treatment.
 */
export function splashTheme(textColor?: SplashBlockFields['textColor']): 'light' | 'dark' {
  return textColorToTheme(textColor, 'dark')
}

/**
 * When a page's content leads with a `splash` block, return its background-context
 * theme; otherwise `null`. Shared by the layout (header overlay theme), the page
 * wrappers (flush-to-top spacing) and PageTemplate (skipping the duplicate title).
 */
export function getLeadSplash(content: Page['content']): { theme: 'light' | 'dark' } | null {
  const first = content?.root?.children?.[0] as
    | { type?: string; fields?: SplashBlockFields & { blockType?: string } }
    | undefined

  if (first?.type !== 'block' || first.fields?.blockType !== 'splash') {
    return null
  }

  return { theme: splashTheme(first.fields.textColor) }
}

/** Coerce a possibly-null/absent CMS text field to a string. */
function asText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/** First available card thumbnail across the collections' image fields:
 * `thumbnail` (meditations/lectures), `meta.image` (pages), `album.artwork` (songs). */
function cardImage(doc: Record<string, unknown>): PopulatedImage | null {
  const meta = doc.meta as { image?: unknown } | null | undefined
  const album = doc.album as { artwork?: unknown } | null | undefined

  return (
    populatedImage(doc.thumbnail) ?? populatedImage(meta?.image) ?? populatedImage(album?.artwork)
  )
}

/**
 * Map one populated showcase relationship to a card, or `null` when it can't be
 * linked or has no thumbnail (degrade rather than render a dead/empty card).
 */
function showcaseCard(item: ShowcaseItem): ResolvedCardItem | null {
  const { relationTo, value } = item

  if (!isPopulated(value)) {
    return null
  }
  const href = cmsHref(relationTo, value as RelationValue)

  // Collections without a public web route (lectures until Ticket 3, app-cards)
  // resolve to null — skip rather than emit a dead link.
  if (!href) {
    return null
  }

  const img = cardImage(value as Record<string, unknown>)

  if (!img) {
    return null
  }
  // Accessor view over the populated doc (the union of card-bearing collections
  // shares these optional fields; an intersection of the generated interfaces
  // would collapse to `never`).
  const doc = value as { id?: number | string; title?: unknown; durationMinutes?: number | null }
  const title = asText(doc.title)

  return {
    id: doc.id ?? href,
    title,
    href,
    thumbnailSrc: img.url,
    thumbnailAlt: img.alt ?? title,
    aspectRatio: img.aspectRatio,
    playButton: relationTo === 'meditations',
    durationMinutes:
      relationTo === 'meditations' && typeof doc.durationMinutes === 'number'
        ? doc.durationMinutes
        : undefined,
  }
}

/** Map showcase relationships to cards; drops unresolvable/thumbnail-less refs. */
export function showcaseItems(items: ShowcaseBlockFields['items']): ResolvedCardItem[] {
  const cards: ResolvedCardItem[] = []

  for (const item of items ?? []) {
    const card = showcaseCard(item)

    if (card) {
      cards.push(card)
    }
  }

  return cards
}

/** CMS field name → SVG node id consumed by the `SubtleSystem` organism. */
const SUBTLE_SYSTEM_NODE_IDS: Record<string, string> = {
  left: 'channel_left',
  right: 'channel_right',
  center: 'channel_center',
  mooladhara: 'chakra_1',
  swadhistan: 'chakra_2',
  nabhi: 'chakra_3',
  void: 'chakra_3b',
  anahat: 'chakra_4',
  vishuddhi: 'chakra_5',
  agnya: 'chakra_6',
  sahasrara: 'chakra_7',
  kundalini: 'kundalini',
}

/** An item for the `SubtleSystem` organism (structurally `SubtleSystemItem`). */
export interface SubtleSystemNodeItem {
  id: string
  title: string
  description: string
  linkHref: string
}

/**
 * Resolve the 12 `subtle-system` page relationships into SubtleSystem items,
 * keyed by the SVG node id each maps to. Unpublished/unroutable pages (bare ids
 * or missing slugs) are dropped so the chart never links to `/undefined`.
 */
export function subtleSystemItems(fields: SubtleSystemBlockFields): SubtleSystemNodeItem[] {
  const items: SubtleSystemNodeItem[] = []

  for (const [field, nodeId] of Object.entries(SUBTLE_SYSTEM_NODE_IDS)) {
    const page = (fields as Record<string, unknown>)[field]

    if (!isPopulated<Page>(page)) {
      continue
    }
    const href = cmsHref('pages', page as RelationValue)

    if (!href) {
      continue
    }

    items.push({
      id: nodeId,
      title: asText(page.title),
      description: page.meta?.description ?? '',
      linkHref: href,
    })
  }

  return items
}

/** True for absolute http(s) URLs (rendered as external links). */
export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

/** Map a content-index API document to a card for the given content type. */
export function contentIndexCard(
  doc: Record<string, unknown>,
  type: ContentIndexBlockFields['type'],
): ResolvedCardItem | null {
  const id = doc.id as string | number | undefined

  if (id == null) {
    return null
  }
  const title = asText(doc.title)

  const href =
    type === 'meditations'
      ? `/meditations/${id}`
      : type === 'pages'
        ? cmsHref('pages', doc as RelationValue)
        : null

  if (!href) {
    return null
  }
  const img = cardImage(doc)

  return {
    id,
    title,
    href,
    thumbnailSrc: img?.url ?? '',
    thumbnailAlt: img?.alt ?? title,
    aspectRatio: img?.aspectRatio,
    playButton: type === 'meditations',
    durationMinutes:
      type === 'meditations' && typeof doc.durationMinutes === 'number'
        ? doc.durationMinutes
        : undefined,
  }
}
