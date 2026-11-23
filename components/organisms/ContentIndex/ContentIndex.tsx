import { useMemo, useState } from 'react'
import { ContentGrid, FilterPills, type Facet } from '@/components/molecules'
import type { ResolvedCardItem } from '@/lib/content/blocks'
import { useFadeOnChange } from '@/hooks/useFadeOnChange'

export interface ContentIndexProps {
  /** Server-resolved cards. Each item's `tags` drive the filter pills. */
  items: ResolvedCardItem[]
  /** `sizes` for one card of the grid below — see `ContentGrid`. */
  sizes: string
  className?: string
}

export type { Facet }

/** Unique facets across all items, in first-appearance order (first label wins). */
export function deriveFacets(items: ResolvedCardItem[]): Facet[] {
  const seen = new Map<string, string>()

  for (const item of items) {
    for (const tag of item.tags ?? []) {
      if (!seen.has(tag.id)) {
        seen.set(tag.id, tag.label)
      }
    }
  }

  return Array.from(seen, ([id, label]) => ({ id, label }))
}

/**
 * Narrow items to those whose tags intersect the selected facet ids (OR). An
 * empty selection returns every item unchanged.
 */
export function filterByFacets(
  items: ResolvedCardItem[],
  selected: Set<string>,
): ResolvedCardItem[] {
  if (selected.size === 0) {
    return items
  }

  return items.filter((item) => (item.tags ?? []).some((tag) => selected.has(tag.id)))
}

/**
 * ContentIndex is a filterable card grid for `pages` or `lectures`
 * content-index blocks. The server resolves the full list, which keeps it
 * SEO-friendly. The visitor then narrows it client-side, with multi-select
 * filter pills derived from the items' own tags. It renders as a plain grid
 * when no facets are present.
 *
 * SSR renders every card, with a pure `useState` and no `ClientOnly`.
 * Hydration then wires up the pill toggles.
 *
 * The pill row is the shared `FilterPills` molecule. This organism toggles each
 * facet independently, so the selection grows — `MeditationLibrary` replaces it
 * instead. The molecule renders either.
 */
export function ContentIndex({ items, sizes, className = '' }: ContentIndexProps) {
  const facets = useMemo(() => deriveFacets(items), [items])
  const [selected, setSelected] = useState<Set<string>>(() => new Set())

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })

  const clear = () => setSelected(new Set())

  // sort() makes the key order-independent: a Set iterates in insertion order,
  // so picking A then B would otherwise differ from B then A.
  const fadeRef = useFadeOnChange(Array.from(selected).sort().join(','))

  // Narrow to items whose tags intersect the selection: this is an OR
  // match, and an empty selection shows everything. Then strip `tags`,
  // because ContentCard forwards unknown props to the DOM.
  const gridItems = useMemo(
    () => filterByFacets(items, selected).map(({ tags: _tags, ...card }) => card),
    [items, selected],
  )

  return (
    <div className={className}>
      {facets.length > 0 && (
        <FilterPills facets={facets} selected={selected} onClear={clear} onToggle={toggle} />
      )}
      <ContentGrid ref={fadeRef} items={gridItems} sizes={sizes} />
    </div>
  )
}
