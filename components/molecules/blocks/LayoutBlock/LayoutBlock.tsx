import type { ReactNode } from 'react'
import { Accordion, type AccordionItemData } from '../../Accordion'
import { ColumnCarousel } from '../../ColumnCarousel'
import type { ColumnProps } from '../../Column'
import { Image, Link } from '../../../atoms'
import { populatedImage, type LayoutBlockFields, type LayoutItem } from '../../../../lib/cms-blocks'

export interface LayoutBlockProps {
  /** Presentation style for the items. */
  style: LayoutBlockFields['style']
  /** Optional section heading shown above the items. */
  title?: string
  /** Tabs only: lay tabs out as side-by-side columns on desktop. */
  useColumnsOnDesktop?: boolean
  /** The layout items. */
  items: LayoutItem[]
  /** Additional CSS classes. */
  className?: string
}

/** Render an item's textarea body, preserving author line breaks. */
function itemText(text?: string | null): ReactNode {
  return text ? <p className="whitespace-pre-line text-gray-700">{text}</p> : null
}

/** A single item for the `grid`/`list` styles: image, linkable title, text. */
function LayoutCard({ item, orientation }: { item: LayoutItem; orientation: 'grid' | 'list' }) {
  const img = populatedImage(item.image)
  const title = item.title ?? ''
  const heading = item.titleUrl ? (
    <Link href={item.titleUrl} variant="primary">
      {title}
    </Link>
  ) : (
    title
  )

  return (
    <div
      className={
        orientation === 'list'
          ? 'flex flex-col gap-4 sm:flex-row sm:items-center'
          : 'flex flex-col gap-3'
      }
    >
      {img && (
        <div className={orientation === 'list' ? 'sm:w-1/3 sm:shrink-0' : ''}>
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
        {title && <h3 className="text-lg font-semibold text-gray-800">{heading}</h3>}
        {itemText(item.text)}
      </div>
    </div>
  )
}

/**
 * Renders the `layout` block in one of five styles. `accordion` and `tabs`
 * reuse the Accordion / ColumnCarousel molecules; `grid`/`list`/`textList`
 * render with the LayoutCard subcomponent and simple lists.
 */
export function LayoutBlock({
  style,
  title,
  useColumnsOnDesktop,
  items,
  className = '',
}: LayoutBlockProps) {
  const withTitle = items.filter((it) => it.title?.trim())

  if (items.length === 0) {
    return null
  }

  const heading = title ? (
    <h2 className="mb-6 text-2xl font-semibold text-gray-800">{title}</h2>
  ) : null

  if (style === 'accordion') {
    const accordionItems: AccordionItemData[] = withTitle.map((it, i) => ({
      id: it.id ?? `item-${i}`,
      title: it.title ?? '',
      content: itemText(it.text),
    }))

    return (
      <section className={className}>
        {heading}
        <Accordion items={accordionItems} />
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
        href: it.titleUrl ?? undefined,
      }
    })

    return (
      <section className={className}>
        {heading}
        <ColumnCarousel columns={columns} />
      </section>
    )
  }

  if (style === 'textList') {
    return (
      <section className={className}>
        {heading}
        <ul className="flex flex-col gap-4">
          {items.map((it, i) => (
            <li key={it.id ?? i}>
              {it.title && <p className="font-semibold text-gray-800">{it.title}</p>}
              {itemText(it.text)}
            </li>
          ))}
        </ul>
      </section>
    )
  }

  // grid (default) and list
  return (
    <section className={`not-prose my-8 ${className}`}>
      {heading}
      <div
        className={
          style === 'list'
            ? 'flex flex-col gap-8'
            : 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'
        }
      >
        {items.map((it, i) => (
          <LayoutCard key={it.id ?? i} item={it} orientation={style === 'list' ? 'list' : 'grid'} />
        ))}
      </div>
    </section>
  )
}
