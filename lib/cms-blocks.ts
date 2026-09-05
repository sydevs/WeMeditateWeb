/**
 * App-side types and pure helpers for the custom Lexical blocks embedded in
 * `pages.content`.
 *
 * The block field shapes are not in the generated `payload-types.ts`. The
 * editor stores them loosely, as `[k: string]: unknown`, inside the
 * lexical tree. So the interfaces here are authored from the upstream
 * SahajCloud block definitions (`src/lib/richEditor/blocks/*`). Keep them
 * in sync with that source.
 *
 * Helpers that turn block fields into component props live here, not in
 * the converters, so they stay unit-testable without rendering.
 */

import type { AppCard, Album, Image, Lecture, SongTag, UserChoice } from '../server/payload-types'
import type { Meditation, Page } from '../server/cms-types'
// Type-only import (erased at build): reuse the audio player's Track shape so the
// songs content-index feeds MusicLibrary without a parallel type.
import type { Track } from '../components/molecules/AudioPlayer/types'
import { cmsHref, type RelationValue } from './cms-routes'
import { isPopulated } from './cms-relationships'
import { nearestAspectRatio, type AspectRatio } from './cloudflare-images'

/** A relationship or upload field: a populated document or a bare ID. */
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
   * Describes the text color (dark or light), mirroring the `textbox`
   * overlay convention. Not yet authored in the CMS (see SahajCloud
   * ticket). Absent is treated as light text on a dark hero (`theme: 'dark'`).
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

/** The `pages` collection's tag enum (drives page content-index facets). */
export type PageTag = NonNullable<Page['tags']>[number]

/** Display labels for page tags. Localizing these (via wm-web-translations)
 * is a follow-up. The enum values are the stable identifiers used for filtering. */
export const PAGE_TAG_LABELS: Record<PageTag, string> = {
  wisdom: 'Wisdom',
  lifestyle: 'Lifestyle',
  creativity: 'Creativity',
  event: 'Event',
  technique: 'Technique',
}

/** `content-index` — ContentIndexBlock. `resolvedItems` and
 * `resolvedTracks` are attached by the server-side pre-resolve pass in
 * `+data`. The editor never stores them. The `*Filters` fields mirror the
 * CMS schema, but rendering does not use them: facets come from the
 * resolved items' own `tags` instead. */
export interface ContentIndexBlockFields {
  type: 'meditations' | 'pages' | 'songs' | 'lectures'
  limit: number
  /** Configured page-tag filters (CMS schema mirror). Facets come from items. */
  pageFilters?: PageTag[] | null
  /** Configured user-choice filters (CMS schema mirror). Facets come from items. */
  userChoiceFilters?: (number | UserChoice)[] | null
  /** Configured song-tag filters (CMS schema mirror). Facets come from tracks. */
  songFilters?: (number | SongTag)[] | null
  /** Virtual field computed by the CMS (path, filters, and limit). */
  apiEndpoint?: string | null
  /** Cards for pages, lectures, and meditations (attached in +data). */
  resolvedItems?: ResolvedCardItem[] | null
  /** Playable tracks for the songs type (attached in +data). */
  resolvedTracks?: Track[] | null
}

// ============================================================================
// Shared card shape + helpers
// ============================================================================

/** A grid or card item shape, structurally compatible with `ContentGridItem`.
 * `tags` are the item's own facets (page-tag enum, or lecture user-choices),
 * used by `ContentIndex` for client-side filter pills. Strip `tags` before
 * spreading onto `ContentCard`, which forwards unknown props to the DOM. */
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
  tags?: { id: string; label: string }[]
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

/** Resolves an upload or relationship ref to image fields, or `null` if unpopulated. */
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

/** Resolves the uploads of an `image-gallery` block to renderable images. */
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
 * Inverts a CMS `textColor` (which describes the text: dark or light)
 * into a background-context `theme`. Light text implies a dark
 * background, and dark text implies a light one. When `textColor` is
 * absent, this function falls back to `fallback`. Shared by the splash
 * hero and the `textbox` overlay, which use this same inversion but
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
 * Derives a Splash background-context theme from its `textColor` field.
 * Defaults to `'dark'` (light text over a dark hero) when the field is
 * absent. This matches the splash's historical hardcoded treatment.
 */
export function splashTheme(textColor?: SplashBlockFields['textColor']): 'light' | 'dark' {
  return textColorToTheme(textColor, 'dark')
}

/**
 * Returns a page's background-context theme when its content leads with
 * a `splash` block, or `null` otherwise. Shared by the layout (header
 * overlay theme), the page wrappers (flush-to-top spacing), and
 * PageTemplate (skipping the duplicate title).
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

/**
 * Resolves the lead splash from a layout route's data, whose shape
 * differs by route. A content route ([slug]) carries the page as `page`.
 * The live-preview route (/preview) carries the previewed document as
 * `initialData`. Only a `pages` preview has splash-leading content
 * (meditation and lecture previews never do). Lets LayoutChrome apply the
 * same overlaid-header treatment in preview as on the published page.
 */
export function leadSplashFromRouteData(
  data:
    | {
        page?: Pick<Page, 'content'> | null
        collection?: string
        initialData?: Pick<Page, 'content'> | null
      }
    | null
    | undefined,
): { theme: 'light' | 'dark' } | null {
  const content =
    data?.page?.content ?? (data?.collection === 'pages' ? data?.initialData?.content : undefined)

  return getLeadSplash(content)
}

/** Coerces a possibly null or absent CMS text field to a string. */
function asText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/** First available card thumbnail across the collections' image fields:
 * `thumbnail` (meditations, lectures), `meta.image` (pages), `album.artwork` (songs). */
function cardImage(doc: Record<string, unknown>): PopulatedImage | null {
  const meta = doc.meta as { image?: unknown } | null | undefined
  const album = doc.album as { artwork?: unknown } | null | undefined

  return (
    populatedImage(doc.thumbnail) ?? populatedImage(meta?.image) ?? populatedImage(album?.artwork)
  )
}

/**
 * Maps one populated showcase relationship to a card, or `null` when it
 * cannot be linked or has no thumbnail. This degrades, instead of
 * rendering a dead or empty card.
 */
function showcaseCard(item: ShowcaseItem): ResolvedCardItem | null {
  const { relationTo, value } = item

  if (!isPopulated(value)) {
    return null
  }
  const href = cmsHref(relationTo, value as RelationValue)

  // Collections without a public web route (app-cards) resolve to null.
  // Skip, instead of emitting a dead link.
  if (!href) {
    return null
  }

  const img = cardImage(value as Record<string, unknown>)

  if (!img) {
    return null
  }
  // Accessor view over the populated doc. The union of card-bearing
  // collections shares these optional fields. An intersection of the
  // generated interfaces would collapse to `never`.
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

/** Maps showcase relationships to cards. Drops unresolvable or thumbnail-less refs. */
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

/** Maps a CMS field name to the SVG node ID the `SubtleSystem` organism consumes. */
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
 * Resolves the 12 `subtle-system` page relationships into SubtleSystem
 * items, keyed by the SVG node ID each maps to. Drops unpublished or
 * unroutable pages (bare IDs or missing slugs), so the chart never links
 * to `/undefined`.
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

/**
 * Filter facets for a content-index card: page-tag enum labels
 * (`pages`), or populated user-choice titles (`lectures`). Other types
 * carry no card-level facets. Returns `undefined`, not `[]`, when empty,
 * so the field is omitted.
 */
function contentIndexCardTags(
  doc: Record<string, unknown>,
  type: ContentIndexBlockFields['type'],
): ResolvedCardItem['tags'] {
  if (type === 'pages') {
    const raw = Array.isArray(doc.tags) ? doc.tags : []
    const facets = raw
      .filter((t): t is PageTag => typeof t === 'string' && t in PAGE_TAG_LABELS)
      .map((t) => ({ id: t, label: PAGE_TAG_LABELS[t] }))

    return facets.length > 0 ? facets : undefined
  }

  if (type === 'lectures') {
    const raw = Array.isArray(doc.userChoices) ? doc.userChoices : []
    const facets = raw
      .map((uc) =>
        isPopulated<UserChoice>(uc) && typeof uc.title === 'string' && uc.title.length > 0
          ? { id: String(uc.id), label: uc.title }
          : null,
      )
      .filter((f): f is { id: string; label: string } => f !== null)

    return facets.length > 0 ? facets : undefined
  }

  return undefined
}

/** Web path for a content-index card by type: meditations route by ID,
 * pages by slug, lectures by ID. Other types have no public route (`null`). */
function cardHref(
  type: ContentIndexBlockFields['type'],
  doc: Record<string, unknown>,
  id: string | number,
): string | null {
  if (type === 'meditations') {
    return `/meditations/${id}`
  }
  if (type === 'pages' || type === 'lectures') {
    return cmsHref(type, doc as RelationValue)
  }

  return null
}

/** Maps a content-index API document to a card for the given content type. */
export function contentIndexCard(
  doc: Record<string, unknown>,
  type: ContentIndexBlockFields['type'],
): ResolvedCardItem | null {
  const id = doc.id as string | number | undefined

  if (id == null) {
    return null
  }
  const title = asText(doc.title)
  const href = cardHref(type, doc, id)

  if (!href) {
    return null
  }
  const img = cardImage(doc)
  // The lectures /for-audience feed returns a plain `thumbnailUrl` string (not a
  // populated `thumbnail` relationship), so fall back to it for the card image.
  const thumbnailUrl = typeof doc.thumbnailUrl === 'string' ? doc.thumbnailUrl : ''

  return {
    id,
    title,
    href,
    thumbnailSrc: img?.url ?? thumbnailUrl,
    thumbnailAlt: img?.alt ?? title,
    aspectRatio: img?.aspectRatio,
    playButton: type === 'meditations',
    durationMinutes:
      type === 'meditations' && typeof doc.durationMinutes === 'number'
        ? doc.durationMinutes
        : undefined,
    tags: contentIndexCardTags(doc, type),
  }
}

/** The four time-of-day meditation slots on a UserChoice category. */
const USER_CHOICE_MEDITATION_SLOTS = [
  'morningMeditation',
  'afternoonMeditation',
  'eveningMeditation',
  'nightMeditation',
] as const

/** Card duration, in minutes, for a populated meditation: the explicit
 * `durationMinutes`, else derived from `duration` (seconds), else omitted.
 * A value below 1 (a sub-minute duration, or `0`) is omitted, since a
 * "0 min" badge is meaningless. */
function meditationDurationMinutes(med: {
  durationMinutes?: number | null
  duration?: number | null
}): number | undefined {
  const minutes =
    typeof med.durationMinutes === 'number'
      ? med.durationMinutes
      : typeof med.duration === 'number' && med.duration > 0
        ? Math.round(med.duration / 60)
        : undefined

  return minutes !== undefined && minutes >= 1 ? minutes : undefined
}

/**
 * Flattens a `meditations` content-index into a deduped grid of
 * meditation cards.
 *
 * The block's endpoint resolves to user-choice categories (for example,
 * the "5 min" or "5-10 min" duration picker), each referencing up to four
 * meditations (morning, afternoon, evening, night). This function merges
 * every referenced meditation into a single card list, and tags each
 * card with the user choices that reference it. `ContentIndex` then
 * renders the meditations as a grid, with the user choices as filter
 * pills. A meditation shared across choices appears once, carrying all
 * its facets. Unpopulated slots and unidentifiable docs are skipped.
 */
export function meditationCardsFromUserChoices(
  docs: Record<string, unknown>[],
): ResolvedCardItem[] {
  const byId = new Map<string | number, ResolvedCardItem>()

  for (const uc of docs) {
    const ucId = uc.id
    const title = asText(uc.title)

    if (ucId == null || title.length === 0) {
      continue
    }
    const facet = { id: String(ucId), label: title }

    for (const slot of USER_CHOICE_MEDITATION_SLOTS) {
      const med = uc[slot]

      if (!isPopulated<Meditation>(med) || med.id == null) {
        continue
      }
      const existing = byId.get(med.id)

      if (existing) {
        // Referenced by more than one choice. Add the facet, deduped.
        if (!existing.tags?.some((t) => t.id === facet.id)) {
          existing.tags = [...(existing.tags ?? []), facet]
        }
        continue
      }
      const img = populatedImage(med.thumbnail)
      const medTitle = asText(med.title) || asText(med.label)

      byId.set(med.id, {
        id: med.id,
        title: medTitle,
        href: `/meditations/${med.id}`,
        thumbnailSrc: img?.url ?? '',
        // Meditation thumbnails are populated without `alt`. Fall back to
        // the title (`||`, so an empty alt still falls through).
        thumbnailAlt: img?.alt || medTitle,
        aspectRatio: img?.aspectRatio,
        playButton: true,
        durationMinutes: meditationDurationMinutes(med),
        tags: [facet],
      })
    }
  }

  return Array.from(byId.values())
}

/**
 * Maps a content-index `songs` API document to a playable {@link Track}
 * for the MusicLibrary organism. Songs with no playable URL are skipped.
 * `duration` is `0`: the Song CMS type has no duration field, so
 * AudioPlayer derives it from the audio element at load. `tags` are the
 * populated SongTag slugs, matched against MusicLibrary's filter IDs.
 */
export function contentIndexTrack(doc: Record<string, unknown>): Track | null {
  const url = typeof doc.url === 'string' ? doc.url : ''

  if (url.length === 0) {
    return null
  }
  const album = isPopulated<Album>(doc.album) ? doc.album : null
  const artwork = album ? populatedImage(album.artwork) : null
  // Prefer the album cover. Fall back to the song's own thumbnail when
  // the album has no artwork, or is an unpublished or bare-id relationship.
  const songThumbnail = typeof doc.thumbnailURL === 'string' ? doc.thumbnailURL : ''
  const tags = (Array.isArray(doc.tags) ? doc.tags : [])
    .map((tag) => (isPopulated<SongTag>(tag) && typeof tag.slug === 'string' ? tag.slug : null))
    .filter((slug): slug is string => slug !== null)

  return {
    url,
    title: asText(doc.title),
    credit: album?.artist ?? '',
    creditURL: album?.artistUrl ?? '',
    thumbnailURL: artwork?.url ?? songThumbnail,
    duration: 0,
    tags,
  }
}
