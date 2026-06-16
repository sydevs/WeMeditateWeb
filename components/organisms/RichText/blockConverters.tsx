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
import { Button, Image } from '../../atoms'
import {
  ContentCard,
  ContentCarousel,
  HeroQuote,
  LayoutBlock,
  TableOfContents,
} from '../../molecules'
import { ContentTextBox } from '../ContentTextBox'
import { Splash } from '../Splash'
import { SubtleSystem } from '../SubtleSystem'
import {
  galleryImages,
  populatedImage,
  showcaseItems,
  subtleSystemItems,
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

export const blockConverters: BlockConverters = {
  // textbox → ContentTextBox. imagePosition left/right map to the side layout;
  // `overlay` maps to `center` (ContentTextBox's text-over-image mode).
  // subtitle / textColor / wisdomStyle are deferred to #30.
  textbox: ({ node }) => {
    const fields = node.fields as unknown as TextBoxBlockFields
    const img = populatedImage(fields.image)

    if (!img) {
      return null
    }
    const align = fields.imagePosition === 'overlay' ? 'center' : fields.imagePosition

    return (
      <ContentTextBox
        align={align}
        className={BLOCK_SPACING}
        ctaHref={fields.buttonUrl ?? undefined}
        ctaText={fields.buttonText ?? undefined}
        description={fields.text ?? ''}
        imageAlt={img.alt}
        imageHeight={img.height}
        imageSrc={img.url}
        imageWidth={img.width}
        title={fields.title ?? ''}
      />
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

  // image-gallery → masonry of Image atoms (a gallery, not link-cards).
  'image-gallery': ({ node }) => {
    const fields = node.fields as unknown as ImageGalleryBlockFields
    const images = galleryImages(fields.items)

    if (images.length === 0) {
      return null
    }

    return (
      <div className={`${BLOCK_SPACING} columns-2 gap-3 sm:columns-3 *:mb-3`}>
        {images.map((img, index) => (
          <Image
            key={`${img.url}-${index}`}
            alt={img.alt}
            aspectRatio={img.aspectRatio}
            className="w-full"
            rounded="rounded"
            sizes="(max-width: 640px) 50vw, 33vw"
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

    return <SubtleSystem className={BLOCK_SPACING} items={items} />
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
        className={BLOCK_SPACING}
        ctaHref={fields.actionURL ?? undefined}
        ctaText={fields.actionText ?? undefined}
        subtitle={fields.subtitle ?? undefined}
        theme="dark"
        title={fields.title ?? undefined}
      />
    )
  },

  // content-index → responsive grid of the live list resolved server-side in
  // `+data` (see server/content-index.ts). A plain grid fills the block width
  // (unlike the centered masonry); empty/unresolvable lists render nothing.
  'content-index': ({ node }) => {
    const fields = node.fields as unknown as ContentIndexBlockFields
    const items = fields.resolvedItems ?? []

    if (items.length === 0) {
      return null
    }

    return (
      <div className={`${BLOCK_SPACING} grid grid-cols-2 gap-4 sm:grid-cols-3`}>
        {items.map(({ id, ...card }) => (
          <ContentCard key={id} {...card} />
        ))}
      </div>
    )
  },
}
