/**
 * App-side helpers for the custom Lexical blocks embedded in `pages.content`.
 *
 * The lexical tree types a block's `fields` as `[k: string]: unknown`, so a
 * converter casts them to the generated `*Block` interface in
 * `payload-types.ts` and imports it from there. A field `pnpm types:cms`
 * renames or removes is then a compile error where it is read. A generated
 * interface describes a saved block, while live preview renders an unsaved
 * one, so a converter still guards a field the schema requires.
 *
 * Helpers that turn block fields into component props live here, not in
 * the converters, so they stay unit-testable without rendering.
 */

import type {
  Album,
  Image,
  ImageGalleryBlock,
  LayoutBlock,
  ShowcaseBlock,
  SongTag,
  SplashBlock,
  SubtleSystemBlock,
  UserChoice,
} from '../server/payload-types'
import type { Meditation, Page } from '../server/sahajcloud-types'
// Type-only import (erased at build): reuse the audio player's Track shape so the
// songs content-index feeds MusicLibrary without a parallel type.
import type { Track } from '../components/molecules/AudioPlayer/types'
import { documentHref, type RelationValue } from './document-routes'
import type { TranslationKey } from './i18n'
import { isPopulated } from './payload-relationships'
import { nearestAspectRatio, type AspectRatio } from './cloudflare-images'

/**
 * The two block shapes the generated schema leaves anonymous, so no consumer
 * can import them: a `showcase` relationship entry and a `layout` item. Both
 * are indexed straight out of the generated interface.
 */
export type ShowcaseItem = NonNullable<ShowcaseBlock['items']>[number]
export type LayoutItem = NonNullable<LayoutBlock['items']>[number]

/** The `pages` collection's tag enum (drives page content-index facets). */
export type PageTag = NonNullable<Page['tags']>[number]

/**
 * Every page-tag enum value, in schema order. The values are the stable
 * filter IDs; their visible labels come from SahajCloud
 * (`article.general.tag_*`), supplied as `pageTagLabels`.
 */
export const PAGE_TAG_KEYS = {
  wisdom: 'article.general.tag_wisdom',
  lifestyle: 'article.general.tag_lifestyle',
  creativity: 'article.general.tag_creativity',
  event: 'article.general.tag_event',
  technique: 'article.general.tag_technique',
} as const satisfies Record<PageTag, TranslationKey>

export const PAGE_TAGS = Object.keys(PAGE_TAG_KEYS) as PageTag[]

/** Visible label per page tag, resolved from SahajCloud by the caller. */
export type PageTagLabels = Partial<Record<PageTag, string>>

/**
 * One mood tile. The label is not here: `t('meditation.general.mood_meditation_label')`
 * composes it from `moodTitle` and `durationMinutes` in the component, so this
 * module stays free of the translations layer.
 */
export interface MoodCard {
  moodId: number
  moodTitle: string
  /** The mood record is itself an SVG upload — there is no separate icon field. */
  iconUrl: string | null
  /** Editor-chosen accent. It carries no contrast contract, so it never backs text. */
  color: string | null
  href: string
  /** Required: the label names the meditation by its length, so a card
   * without one has nothing to render. */
  durationMinutes: number
  thumbnail: PopulatedImage | null
}

/** `content-index` — ContentIndexBlock. `resolvedItems` and
 * `resolvedTracks` are attached by the server-side pre-resolve pass in
 * `+data`. The editor never stores them. The `*Filters` fields mirror the
 * SahajCloud schema, but rendering does not use them: facets come from the
 * resolved items' own `tags` instead. */
// shortcut: hand-written until #293 lands; then extend ContentIndexBlock instead.
export interface ContentIndexBlockFields {
  type: 'meditations' | 'pages' | 'songs' | 'lectures' | 'moods'
  limit: number
  /** Configured page-tag filters (SahajCloud schema mirror). Facets come from items. */
  pageFilters?: PageTag[] | null
  /** Configured user-choice filters (SahajCloud schema mirror). Facets come from items. */
  userChoiceFilters?: (number | UserChoice)[] | null
  /** Configured song-tag filters (SahajCloud schema mirror). Facets come from tracks. */
  songFilters?: (number | SongTag)[] | null
  /** Virtual field computed by SahajCloud (path, filters, and limit). */
  apiEndpoint?: string | null
  /** Cards for pages, lectures, and meditations (attached in +data). */
  resolvedItems?: ResolvedCardItem[] | null
  /** Playable tracks for the songs type (attached in +data). */
  resolvedTracks?: Track[] | null
  /** Mood tiles for the moods type (attached in +data). Carries a per-mood
   * icon and accent colour, which a card has no slot for. */
  resolvedMoods?: MoodCard[] | null
}

/**
 * Every `content-index` block's `fields` object in a lexical tree, in
 * document order.
 *
 * ⚠ **The objects come back by reference**, which is what lets
 * `server/content-index.ts` fill each block's resolved list in place before
 * SSR. The head reads the same lists (`lib/content-seo.ts`).
 */
export function contentIndexBlocks(content: unknown): ContentIndexBlockFields[] {
  const found: ContentIndexBlockFields[] = []
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(walk)

      return
    }
    if (node && typeof node === 'object') {
      const candidate = node as { type?: unknown; fields?: { blockType?: unknown } }

      if (candidate.type === 'block' && candidate.fields?.blockType === 'content-index') {
        found.push(candidate.fields as ContentIndexBlockFields)
      }
      Object.values(node).forEach(walk)
    }
  }

  walk(content)

  return found
}

// --- Shared card shape + helpers ---

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
export function galleryImages(images: ImageGalleryBlock['items']): PopulatedImage[] {
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
 * Inverts a SahajCloud `textColor` (which describes the text: dark or light)
 * into the `surface` its background paints. Light text implies a dark
 * background, and dark text implies a light one. When `textColor` is
 * absent, this function falls back to `fallback`. Shared by the splash
 * hero and the `textbox` overlay, which use this same inversion but
 * differ only in their default.
 */
export function textColorToSurface(
  textColor: 'dark' | 'light' | null | undefined,
  fallback: 'light' | 'dark',
): 'light' | 'dark' {
  if (textColor === 'dark') return 'light'
  if (textColor === 'light') return 'dark'

  return fallback
}

/**
 * Derives a Splash surface from its `textColor` field.
 * Defaults to `'dark'` (light text over a dark hero) when the field is
 * absent. This matches the splash's historical hardcoded treatment.
 */
export function splashSurface(textColor?: SplashBlock['textColor']): 'light' | 'dark' {
  return textColorToSurface(textColor, 'dark')
}

/** What a page's lead `splash` block tells its consumers. */
export interface LeadSplash {
  surface: 'light' | 'dark'
  /**
   * Whether the splash draws a heading of its own. `Splash` renders its `<h1>`
   * only when `title` is set, and the field is optional upstream — so a page
   * leading with an untitled splash has no heading unless something else
   * supplies one.
   */
  hasTitle: boolean
}

/**
 * Returns what a page's lead `splash` block paints, or `null` when its content
 * does not lead with one. Shared by the layout (header overlay surface), the
 * page wrappers (flush-to-top spacing), and PageTemplate (skipping the
 * duplicate title, and supplying the heading an untitled splash does not draw).
 */
export function getLeadSplash(content: Page['content']): LeadSplash | null {
  const first = content?.root?.children?.[0] as { type?: string; fields?: SplashBlock } | undefined

  if (first?.type !== 'block' || first.fields?.blockType !== 'splash') {
    return null
  }

  return {
    surface: splashSurface(first.fields.textColor),
    hasTitle: Boolean(first.fields.title?.trim()),
  }
}

/**
 * Resolves the lead splash from a layout route's data. `pages` is the only
 * collection whose content can lead with one, so `[slug]`'s `page` is the only
 * shape to read; every other layout route gets no overlaid header.
 */
export function leadSplashFromRouteData(
  data: { page?: Pick<Page, 'content'> | null } | null | undefined,
): { surface: 'light' | 'dark' } | null {
  return getLeadSplash(data?.page?.content)
}

/** Coerces a possibly null or absent SahajCloud text field to a string. */
export function asText(value: unknown): string {
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
  const href = documentHref(relationTo, value as RelationValue)

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
export function showcaseItems(items: ShowcaseBlock['items']): ResolvedCardItem[] {
  const cards: ResolvedCardItem[] = []

  for (const item of items ?? []) {
    const card = showcaseCard(item)

    if (card) {
      cards.push(card)
    }
  }

  return cards
}

/** A `subtle-system` block's own relationship fields, without the block envelope. */
type SubtleSystemField = keyof Omit<SubtleSystemBlock, 'id' | 'blockName' | 'blockType'>

/** Maps a SahajCloud field name to the SVG node ID the `SubtleSystem` organism consumes.
 * `satisfies` is what fails the build when upstream renames, adds or drops one. */
const SUBTLE_SYSTEM_NODE_IDS = {
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
} as const satisfies Record<SubtleSystemField, string>

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
export function subtleSystemItems(fields: SubtleSystemBlock): SubtleSystemNodeItem[] {
  const items: SubtleSystemNodeItem[] = []

  for (const [field, nodeId] of Object.entries(SUBTLE_SYSTEM_NODE_IDS)) {
    const page = fields[field as SubtleSystemField]

    if (!isPopulated<Page>(page)) {
      continue
    }
    const href = documentHref('pages', page as RelationValue)

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

/**
 * Filter facets for a content-index card: page-tag enum labels
 * (`pages`), or populated user-choice titles (`lectures`). Other types
 * carry no card-level facets. Returns `undefined`, not `[]`, when empty,
 * so the field is omitted.
 */
function contentIndexCardTags(
  doc: Record<string, unknown>,
  type: ContentIndexBlockFields['type'],
  pageTagLabels: PageTagLabels = {},
): ResolvedCardItem['tags'] {
  if (type === 'pages') {
    const raw = Array.isArray(doc.tags) ? doc.tags : []
    const facets = raw
      .filter((t): t is PageTag => typeof t === 'string' && PAGE_TAGS.includes(t as PageTag))
      // A label the caller did not supply falls back to the enum value, so
      // a SahajCloud gap shows the identifier instead of an empty pill.
      .map((t) => ({ id: t, label: pageTagLabels[t] ?? t }))

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
    return documentHref('meditations', { id })
  }
  if (type === 'pages' || type === 'lectures') {
    return documentHref(type, doc as RelationValue)
  }

  return null
}

/** Maps a content-index API document to a card for the given content type. */
export function contentIndexCard(
  doc: Record<string, unknown>,
  type: ContentIndexBlockFields['type'],
  pageTagLabels: PageTagLabels = {},
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
    tags: contentIndexCardTags(doc, type, pageTagLabels),
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
export function meditationDurationMinutes(med: {
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

      const href = documentHref('meditations', { id: med.id })

      if (!href) {
        continue
      }

      byId.set(med.id, {
        id: med.id,
        title: medTitle,
        href,
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
 * `duration` is `0` where SahajCloud stores no usable length; AudioPlayer
 * derives the playing track's own from the audio element. `tags` are the
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
  const populatedTags = (Array.isArray(doc.tags) ? doc.tags : []).filter(
    (tag): tag is SongTag => isPopulated<SongTag>(tag) && typeof tag.slug === 'string',
  )
  // The slug is the filter id; the SahajCloud `title` is what the pill shows. A
  // tag with no title falls back to its slug rather than to title-casing,
  // so a SahajCloud gap is visible instead of silently rendering English.
  const tags = populatedTags.map((tag) => ({
    id: tag.slug as string,
    label: typeof tag.title === 'string' && tag.title.length > 0 ? tag.title : (tag.slug as string),
  }))

  return {
    url,
    title: asText(doc.title),
    credit: album?.artist ?? '',
    creditURL: album?.artistUrl ?? '',
    thumbnailURL: artwork?.url ?? songThumbnail,
    duration: typeof doc.duration === 'number' ? doc.duration : 0,
    tags,
  }
}
