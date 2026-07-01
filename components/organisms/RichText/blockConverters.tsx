/**
 * Lexical → React converters for the custom Page blocks embedded in
 * `pages.content`. Wired into the RichText converter map under the `blocks`
 * key, keyed by each block's `blockType` slug.
 *
 * Each converter reads the (loosely-typed) `node.fields`, casts it to the
 * matching interface from `lib/cms-blocks`, and renders an existing component.
 * Blocks that can't render meaningfully (missing required field, empty
 * relationship) return `null` and degrade silently.
 */

import type { JSXConverters } from '@payloadcms/richtext-lexical/react'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { Button, Container, Image } from '../../atoms'
import {
  ContentCard,
  ContentCarousel,
  HeroQuote,
  LayoutBlock,
  TableOfContents,
  type Track,
} from '../../molecules'
import { ContentIndex } from '../ContentIndex'
import { ContentOverlay } from '../ContentOverlay'
import { ContentTextBox } from '../ContentTextBox'
import { MusicLibrary, type MusicFilter } from '../MusicLibrary'
import { OrnateTextBox } from '../OrnateTextBox'
import { Splash } from '../Splash'
import { SubtleSystem } from '../SubtleSystem'
import {
  galleryImages,
  populatedImage,
  showcaseItems,
  splashTheme,
  subtleSystemItems,
  textColorToTheme,
  type ButtonBlockFields,
  type ContentIndexBlockFields,
  type ImageGalleryBlockFields,
  type LayoutBlockFields,
  type QuoteBlockFields,
  type ShowcaseBlockFields,
  type SplashBlockFields,
  type SubtleSystemBlockFields,
  type TableOfContentsBlockFields,
  type TextBoxBlockFields,
} from '../../../lib/cms-blocks'

/** The block-converter map shape expected by `@payloadcms/richtext-lexical`. */
export type BlockConverters = NonNullable<JSXConverters['blocks']>

/**
 * Standard spacing applied to non-typographic blocks (media/sections): a small
 * vertical margin so they read as distinct sections, `mx-auto` so
 * width-constrained blocks (e.g. the quote) stay centered, and `clear-both` so
 * a block never collides with a floated blockquote. Handled here at the organism
 * level rather than per component. Buttons are treated as typographic and
 * intentionally omit it.
 */
export const BLOCK_SPACING = 'mx-auto my-6 clear-both'

/**
 * Width-escaping blocks break out of the article column to span the full content
 * container via the `full-bleed` utility (see layouts/tailwind.css). `clear-both`
 * keeps them clear of floated blockquotes; no `mx-auto` (full-bleed owns the
 * horizontal margins).
 *
 * `FULL_BLEED_BLOCK` (OrnateTextBox, SubtleSystem) keeps vertical block spacing;
 * `FULL_BLEED_SPLASH` drops it so a lead splash sits flush under the overlaid header.
 */
export const FULL_BLEED_BLOCK = 'full-bleed my-6 clear-both'
export const FULL_BLEED_SPLASH = 'full-bleed clear-both'

/** Title-case a song-tag slug for a filter label ('wind-instruments' → 'Wind Instruments'). */
function humanizeSlug(slug: string): string {
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Build MusicLibrary filters from the unique song-tag slugs across the tracks.
 * SongTag carries no icon, so every filter uses a single music glyph (the
 * shared MusicLibrary/Playlist API takes a Heroicon per filter).
 */
function songMusicFilters(tracks: Track[]): MusicFilter[] {
  const seen = new Set<string>()
  const filters: MusicFilter[] = []

  for (const track of tracks) {
    for (const slug of track.tags ?? []) {
      if (!seen.has(slug)) {
        seen.add(slug)
        filters.push({ id: slug, label: humanizeSlug(slug), icon: MusicalNoteIcon })
      }
    }
  }

  return filters
}

export const blockConverters: BlockConverters = {
  // textbox → one of three organisms by the block's mode:
  //   imagePosition 'overlay'      → ContentOverlay (text over the image)
  //   wisdomStyle (non-overlay)    → OrnateTextBox  ("Ancient Wisdom" treatment)
  //   otherwise (left/right)       → ContentTextBox (side box overlapping image)
  textbox: ({ node }) => {
    const fields = node.fields as unknown as TextBoxBlockFields
    const img = populatedImage(fields.image)

    if (!img) {
      return null
    }
    const ctaHref = fields.buttonUrl ?? undefined
    const ctaText = fields.buttonText ?? undefined
    const subtitle = fields.subtitle ?? undefined
    const title = fields.title ?? ''
    const description = fields.text ?? ''

    // Overlay: text sits over the image. The CMS `textColor` describes the
    // *text* (dark/light) while `theme` describes the *background context*
    // (Splash convention), so they invert: light text → dark theme.
    if (fields.imagePosition === 'overlay') {
      return (
        <ContentOverlay
          align={fields.textPosition ?? 'center'}
          className={FULL_BLEED_BLOCK}
          ctaHref={ctaHref}
          ctaText={ctaText}
          imageAlt={img.alt}
          imageSrc={img.url}
          subtitle={subtitle}
          text={description}
          theme={textColorToTheme(fields.textColor, 'light')}
          title={title}
        />
      )
    }

    // Side layouts share most props; OrnateTextBox renders the "Ancient Wisdom"
    // treatment (left-aligned only), ContentTextBox the default white box.
    const sideProps = {
      className: BLOCK_SPACING,
      ctaHref,
      ctaText,
      description,
      imageAlt: img.alt,
      imageAspectRatio: img.aspectRatio,
      imageHeight: img.height,
      imageSrc: img.url,
      imageWidth: img.width,
      subtitle,
      title,
    }

    return fields.wisdomStyle ? (
      // OrnateTextBox breaks out to full content width (later className wins over
      // the spread BLOCK_SPACING).
      <OrnateTextBox {...sideProps} className={FULL_BLEED_BLOCK} />
    ) : (
      // ContentTextBox is wider than the readable body but capped (not full
      // window): break out of the prose Container with full-bleed, then constrain
      // to the Container `xl` width (6xl) with gutters. `className=""` drops the
      // spread BLOCK_SPACING since the wrapper owns spacing/centering.
      <div className={FULL_BLEED_BLOCK}>
        <Container maxWidth="xl">
          <ContentTextBox {...sideProps} align={fields.imagePosition} className="" />
        </Container>
      </div>
    )
  },

  // quote → HeroQuote (supports title + text + credit + caption).
  quote: ({ node }) => {
    const fields = node.fields as unknown as QuoteBlockFields

    if (!fields.text) {
      return null
    }

    return (
      <HeroQuote
        caption={fields.caption ?? undefined}
        className={BLOCK_SPACING}
        credit={fields.credit ?? undefined}
        text={fields.text}
        title={fields.title ?? undefined}
      />
    )
  },

  // button → centered CTA Button.
  button: ({ node }) => {
    const fields = node.fields as unknown as ButtonBlockFields

    if (!fields.text || !fields.url) {
      return null
    }

    return (
      <div className="flex justify-center">
        <Button href={fields.url} size="lg" variant="primary">
          {fields.text}
        </Button>
      </div>
    )
  },

  // image-gallery → masonry of Image atoms (a gallery, not link-cards). Each
  // gallery is its own lightbox group, keyed by the block id, so the overlay's
  // prev/next navigation and thumbnail strip stay scoped to that gallery.
  'image-gallery': ({ node }) => {
    const fields = node.fields as unknown as ImageGalleryBlockFields
    const images = galleryImages(fields.items)

    if (images.length === 0) {
      return null
    }
    const blockId = (node.fields as { id?: string | number }).id
    const group = `gallery-${String(blockId ?? images[0].url)}`

    return (
      <div className={`${BLOCK_SPACING} columns-2 gap-3 lg:columns-3 *:mb-3`}>
        {images.map((img, index) => (
          <Image
            key={`${img.url}-${index}`}
            alt={img.alt}
            aspectRatio={img.aspectRatio}
            className="w-full"
            lightboxGroup={group}
            lightboxIndex={index}
            rounded="rounded"
            sizes="(max-width: 1024px) 50vw, 33vw"
            src={img.url}
          />
        ))}
      </div>
    )
  },

  // layout → grid / tabs / accordion / list / textList.
  layout: ({ node }) => {
    const fields = node.fields as unknown as LayoutBlockFields

    return (
      <LayoutBlock
        className={BLOCK_SPACING}
        items={fields.items ?? []}
        style={fields.style}
        title={fields.title ?? undefined}
        useColumnsOnDesktop={fields.useColumnsOnDesktop ?? undefined}
      />
    )
  },

  // table-of-contents → anchor links to the page's headings.
  'table-of-contents': ({ node }) => {
    const fields = node.fields as unknown as TableOfContentsBlockFields

    if (!fields.headings || fields.headings.length === 0) {
      return null
    }

    return <TableOfContents headings={fields.headings} title={fields.title ?? undefined} />
  },

  // showcase → carousel of hero cards from the populated relationships.
  // Unroutable or thumbnail-less refs are dropped by showcaseItems (no
  // broken/empty cards). `id` is stringified for the article-card HTML id.
  showcase: ({ node }) => {
    const fields = node.fields as unknown as ShowcaseBlockFields
    const items = showcaseItems(fields.items)

    if (items.length === 0) {
      return null
    }

    return (
      <ContentCarousel
        className={BLOCK_SPACING}
        items={items.map((item) => ({ ...item, id: String(item.id) }))}
      />
    )
  },

  // subtle-system → interactive chart; the 12 page relationships map to SVG
  // node ids, dropping any unpublished/unroutable page.
  'subtle-system': ({ node }) => {
    const fields = node.fields as unknown as SubtleSystemBlockFields
    const items = subtleSystemItems(fields)

    if (items.length === 0) {
      return null
    }

    return <SubtleSystem className={FULL_BLEED_BLOCK} items={items} />
  },

  // splash → full-bleed Splash. The block's countdown/app/map-search layouts
  // lack the extra data (target date, store links, search target) to render
  // their interactive extras, so every layout renders the shared hero with the
  // available title/subtitle/CTA over the first image.
  splash: ({ node }) => {
    const fields = node.fields as unknown as SplashBlockFields
    const bg = populatedImage(fields.images?.[0])

    if (!bg) {
      return null
    }

    return (
      <Splash
        backgroundImage={bg.url}
        // Full-bleed and flush: a lead splash sits at the top of the page under
        // the overlaid header (see LayoutChrome / getLeadSplash).
        className={FULL_BLEED_SPLASH}
        ctaHref={fields.actionURL ?? undefined}
        ctaText={fields.actionText ?? undefined}
        subtitle={fields.subtitle ?? undefined}
        theme={splashTheme(fields.textColor)}
        title={fields.title ?? undefined}
      />
    )
  },

  // content-index → the live list resolved server-side in `+data` (see
  // server/content-index.ts), dispatched by content type:
  //   songs        → MusicLibrary (playback + its own tag filtering)
  //   pages/lectures → ContentIndex (filterable card grid with pills)
  //   meditations  → static card grid (deferred; no client filtering)
  // Empty / unresolvable lists render nothing.
  'content-index': ({ node }) => {
    const fields = node.fields as unknown as ContentIndexBlockFields

    if (fields.type === 'songs') {
      const tracks = fields.resolvedTracks ?? []

      if (tracks.length === 0) {
        return null
      }

      return (
        <div className={FULL_BLEED_BLOCK}>
          <MusicLibrary filters={songMusicFilters(tracks)} tracks={tracks} />
        </div>
      )
    }

    const items = fields.resolvedItems ?? []

    if (items.length === 0) {
      return null
    }

    // Meditations keep the static grid (client filtering deferred). A plain grid
    // fills the block width (unlike the centered masonry). `tags` is stripped —
    // ContentCard forwards unknown props to the DOM.
    if (fields.type === 'meditations') {
      return (
        <div className={`${BLOCK_SPACING} grid grid-cols-2 gap-4 lg:grid-cols-3`}>
          {items.map(({ id, tags: _tags, ...card }) => (
            <ContentCard key={id} {...card} />
          ))}
        </div>
      )
    }

    // Pages / lectures → filterable grid with facet pills.
    return <ContentIndex className={BLOCK_SPACING} items={items} />
  },
}
