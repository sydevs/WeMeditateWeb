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
import { HeroQuote, LayoutBlock, TableOfContents } from '../../molecules'
import { ContentTextBox } from '../ContentTextBox'
import {
  galleryImages,
  populatedImage,
  type ButtonBlockFields,
  type ImageGalleryBlockFields,
  type LayoutBlockFields,
  type QuoteBlockFields,
  type TableOfContentsBlockFields,
  type TextBoxBlockFields,
} from '../../../lib/cms-blocks'

/** The block-converter map shape expected by `@payloadcms/richtext-lexical`. */
export type BlockConverters = NonNullable<JSXConverters['blocks']>

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
        className="not-prose my-10"
        ctaHref={fields.buttonUrl ?? ''}
        ctaText={fields.buttonText ?? ''}
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
      <div className="not-prose my-6 flex justify-center">
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
      <div className="not-prose my-8 columns-2 gap-3 sm:columns-3 [&>*]:mb-3">
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
}
