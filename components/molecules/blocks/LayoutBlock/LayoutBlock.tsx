import type { ReactNode } from 'react'
import { Accordion, type AccordionItemData } from '../../Accordion'
import { ColumnCarousel } from '../../ColumnCarousel'
import type { ColumnProps } from '../../Column'
import { MasonryGrid, type MasonryGridItem } from '../../MasonryGrid'
import { editorLinkHref } from '../../../../lib/urls'
import { Heading, Image, Link } from '../../../atoms'
import {
  populatedImage,
  type LayoutBlockFields,
  type LayoutItem,
} from '../../../../lib/content-blocks'

/**
 * The level an item's own title takes. A section with a heading of its own
 * nests its items one level under it; a section with none has to start the
 * level itself, or the items read as orphans (axe `heading-order`).
 */
type ItemHeadingLevel = 'h2' | 'h3'

export interface LayoutBlockProps {
  /** Presentation style for the items. */
  style: LayoutBlockFields['style']
  /** Optional section heading shown above the items. */
  title?: string
  /** Tabs only: the anchor (`#slug`) of the tab to open on. */
  defaultTab?: string
  /** The layout items. */
  items: LayoutItem[]
  /** Additional CSS classes. */
  className?: string
}

/** Render an item's textarea body, preserving author line breaks. */
function itemText(text?: string | null): ReactNode {
  return text ? <p className="whitespace-pre-line text-gray-700">{text}</p> : null
}

/** A single item for the `list` style: image, linkable title, text. */
function LayoutCard({ item, headingLevel }: { item: LayoutItem; headingLevel: ItemHeadingLevel }) {
  const img = populatedImage(item.image)
  const title = item.title ?? ''
  const heading = item.titleUrl ? (
    <Link href={editorLinkHref(item.titleUrl)} variant="primary">
      {title}
    </Link>
  ) : (
    title
  )

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {img && (
        <div className="sm:w-1/3 sm:shrink-0">
          <Image
            alt={img.alt || title}
            aspectRatio="video"
            rounded="rounded"
            sizes="(max-width: 640px) 100vw, 33vw"
            src={img.url}
          />
        </div>
      )}
      <div className="flex flex-col gap-2">
        {title && (
          <Heading
            className="text-lg font-semibold text-gray-800"
            level={headingLevel}
            styleAs="none"
          >
            {heading}
          </Heading>
        )}
        {itemText(item.text)}
      </div>
    </div>
  )
}

/**
 * An accordion item's panel: the image and the title link SahajCloud offers
 * every non-tab style. The title is the toggle, so the link cannot be it, and
 * takes the title's words at the foot of the panel instead.
 */
function AccordionItemBody({ item }: { item: LayoutItem }) {
  const img = populatedImage(item.image)

  return (
    <>
      {img && (
        <div className="mb-4">
          <Image
            alt={img.alt || item.title || ''}
            aspectRatio="video"
            rounded="rounded"
            sizes="(max-width: 767px) 100vw, 768px"
            src={img.url}
          />
        </div>
      )}
      {itemText(item.text)}
      {item.titleUrl && (
        <p className="mt-4">
          <Link href={editorLinkHref(item.titleUrl)} variant="primary">
            {item.title}
          </Link>
        </p>
      )}
    </>
  )
}

/** A layout item as a `MasonryGrid` item. */
function gridItem(item: LayoutItem, index: number): MasonryGridItem {
  const img = populatedImage(item.image)

  return {
    id: item.id ?? index,
    title: item.title ?? undefined,
    href: item.titleUrl ? editorLinkHref(item.titleUrl) : undefined,
    text: item.text ?? undefined,
    image: img ? { src: img.url, alt: img.alt || item.title || '' } : undefined,
  }
}

/**
 * Renders the `layout` block in one of five styles. `accordion`, `tabs` and
 * `grid` reuse the Accordion, ColumnCarousel and MasonryGrid molecules.
 * `list` and `textList` render with the LayoutCard subcomponent and a
 * simple list.
 *
 * `tabs` draws the old site's columns: side by side on a wide screen, a
 * carousel on a narrow one, opening on `defaultTab`. There is no tab UI,
 * because wemeditate.com never drew one for these blocks.
 */
export function LayoutBlock({ style, title, defaultTab, items, className = '' }: LayoutBlockProps) {
  const withTitle = items.filter((it) => it.title?.trim())

  if (items.length === 0) {
    return null
  }

  const heading = title ? (
    <h2 className="mb-6 text-2xl font-semibold text-gray-800">{title}</h2>
  ) : null
  const itemHeadingLevel: ItemHeadingLevel = heading ? 'h3' : 'h2'

  if (style === 'accordion') {
    const accordionItems: AccordionItemData[] = withTitle.map((it, i) => ({
      id: it.id ?? `item-${i}`,
      title: it.title ?? '',
      content: <AccordionItemBody item={it} />,
    }))

    return (
      <section className={className}>
        {heading}
        <Accordion headingLevel={itemHeadingLevel} items={accordionItems} />
      </section>
    )
  }

  if (style === 'tabs') {
    const columns: ColumnProps[] = withTitle.map((it) => {
      const img = populatedImage(it.image)

      return {
        title: it.title ?? '',
        description: itemText(it.text),
        imageUrl: img?.url,
        imageAlt: img?.alt || it.title || '',
        headingLevel: itemHeadingLevel,
      }
    })
    // A tab's `titleUrl` is the anchor SahajCloud derives from its title, and
    // `defaultTab` is spelled the same way. It is never a link: as one, it
    // pointed each title at an id nothing on the page carries.
    const defaultIndex = withTitle.findIndex((it) => defaultTab && it.titleUrl === defaultTab)

    return (
      <section className={className}>
        {heading}
        <ColumnCarousel
          columns={columns}
          startIndex={defaultIndex === -1 ? undefined : defaultIndex}
        />
      </section>
    )
  }

  if (style === 'textList') {
    return (
      <section className={className}>
        {heading}
        <ul className="flex flex-col gap-4">
          {items.map((it, i) => (
            // eslint-disable-next-line @eslint-react/no-array-index-key -- the id is the key wherever SahajCloud sends one; the index is only its fallback
            <li key={it.id ?? i}>
              {it.title && <p className="font-semibold text-gray-800">{it.title}</p>}
              {itemText(it.text)}
            </li>
          ))}
        </ul>
      </section>
    )
  }

  if (style === 'list') {
    return (
      <section className={`not-prose my-8 ${className}`}>
        {heading}
        <div className="flex flex-col gap-8">
          {items.map((it, i) => (
            <LayoutCard
              // eslint-disable-next-line @eslint-react/no-array-index-key -- the id is the key wherever SahajCloud sends one; the index is only its fallback
              key={it.id ?? i}
              headingLevel={itemHeadingLevel}
              item={it}
            />
          ))}
        </div>
      </section>
    )
  }

  // grid, and anything SahajCloud adds before this renderer knows it
  return (
    <section className={`not-prose my-8 ${className}`}>
      {heading}
      <MasonryGrid headingLevel={itemHeadingLevel} items={items.map(gridItem)} />
    </section>
  )
}
