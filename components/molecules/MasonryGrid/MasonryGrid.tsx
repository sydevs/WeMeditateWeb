import { ComponentProps, useEffect, useId, useRef, useState } from 'react'
import { Button, Heading, Image, Link } from '../../atoms'
import { useT } from '../../../hooks/useT'

export interface MasonryGridItem {
  /** Unique identifier for the item */
  id: string | number
  /** The item's title. */
  title?: string
  /** Where the title links to. Without one the title is plain text. */
  href?: string
  /** Body text. Its line breaks are kept. */
  text?: string
  /** An image above the title. */
  image?: { src: string; alt: string }
}

export interface MasonryGridProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Array of items to display in the masonry grid */
  items: MasonryGridItem[]
  /**
   * Number of items to show before "Show More" is clicked.
   *
   * shortcut: 3 for every caller, as the old site showed, because SahajCloud's
   * layout block has no count field; take one from the block once it does.
   * @default 3
   */
  initialItemCount?: number
  /**
   * The level each item's title takes: one under the section heading above
   * the grid, or `h2` where there is none.
   * @default 'h3'
   */
  headingLevel?: 'h2' | 'h3'
}

/** One item: image, title (linked when it has an href), text. */
function MasonryGridCard({
  item,
  headingLevel,
}: {
  item: MasonryGridItem
  headingLevel: 'h2' | 'h3'
}) {
  return (
    <>
      {item.image && (
        <div className="mb-4">
          <Image
            alt={item.image.alt}
            aspectRatio="video"
            rounded="rounded"
            // Three columns of the 864px article body at `lg`, gutters out.
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 270px"
            src={item.image.src}
          />
        </div>
      )}
      {item.title && (
        <Heading
          className="mb-4 text-xl font-medium tracking-wide text-gray-700"
          level={headingLevel}
          styleAs="none"
        >
          {item.href ? (
            <Link href={item.href} variant="primary">
              {item.title}
            </Link>
          ) : (
            item.title
          )}
        </Heading>
      )}
      {item.text && (
        <p className="whitespace-pre-line text-base font-light leading-relaxed text-gray-700">
          {item.text}
        </p>
      )}
    </>
  )
}

/**
 * MasonryGrid is a molecule that displays items in a responsive masonry
 * layout, with optional "Show More" functionality. It renders the layout
 * block's `grid` style, after wemeditate.com's `.cb-grid-layout`.
 *
 * Every item is in the server's markup. Those past `initialItemCount` carry
 * `hidden`, which keeps them out of the accessibility tree and the tab order
 * until "Show More" reveals them, and focus then moves to the first of them,
 * since the button it was on is gone. Without JavaScript, `tailwind.css`
 * shows them all and drops the button, keyed on the `data-masonry-*` hooks.
 */
export function MasonryGrid({
  items,
  initialItemCount = 3,
  headingLevel = 'h3',
  className = '',
  ...props
}: MasonryGridProps) {
  const t = useT()
  const [showAll, setShowAll] = useState(false)
  const firstRevealedRef = useRef<HTMLLIElement>(null)
  const countId = useId()
  const hiddenCount = showAll ? 0 : Math.max(items.length - initialItemCount, 0)

  useEffect(() => {
    if (showAll) {
      firstRevealedRef.current?.focus()
    }
  }, [showAll])

  return (
    <div className={className} {...props}>
      <ul className="masonry gap-x-8 gap-y-12" data-masonry-grid="">
        {items.map((item, index) => (
          <li
            key={item.id}
            ref={index === initialItemCount ? firstRevealedRef : undefined}
            className="focus-ring"
            hidden={index >= initialItemCount && !showAll}
            tabIndex={index === initialItemCount ? -1 : undefined}
          >
            <MasonryGridCard headingLevel={headingLevel} item={item} />
          </li>
        ))}
      </ul>

      {hiddenCount > 0 && (
        <div className="mt-8 text-center md:mt-12" data-masonry-show-more="">
          {/* The count is a description, not the name: a name must contain
              the visible label, which WCAG 2.1 2.5.3 Label in Name requires
              (#201). */}
          <Button aria-describedby={countId} variant="outline" onClick={() => setShowAll(true)}>
            {t('common.general.show_more')}
          </Button>
          <span hidden id={countId}>
            {t('common.a11y.show_more_items', { count: hiddenCount })}
          </span>
        </div>
      )}
    </div>
  )
}
