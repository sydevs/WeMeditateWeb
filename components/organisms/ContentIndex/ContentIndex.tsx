import { useMemo, useState } from 'react'
import { Button } from '../../atoms'
import { ContentGrid } from '../../molecules'
import type { ResolvedCardItem } from '../../../lib/cms-blocks'

export interface ContentIndexProps {
  /** Server-resolved cards. Each item's `tags` drive the filter pills. */
  items: ResolvedCardItem[]
  className?: string
}

/** A filter facet — the id is matched against an item's `tags`. */
export type Facet = { id: string; label: string }

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

interface FilterPillsProps {
  facets: Facet[]
  /** Selected facet ids; empty means "All". */
  selected: Set<string>
  onToggle: (id: string) => void
  onClear: () => void
}

/** A toggle pill built on the Button atom (square, primary when active).
 * `min-h-11` keeps the ≥44px touch target the `sm` size alone doesn't guarantee. */
function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <Button
      aria-pressed={active}
      className="min-h-11"
      shape="square"
      size="sm"
      variant={active ? 'primary' : 'ghost'}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

/**
 * Filter pill row: an "All" pill plus one toggle per facet. Multi-select with OR
 * semantics; "All" clears the selection. Kept internal — extract a reusable
 * `FilterPills` molecule only when a second consumer appears.
 */
function FilterPills({ facets, selected, onToggle, onClear }: FilterPillsProps) {
  return (
    <div
      aria-label="Filter content by tag"
      className="flex flex-wrap justify-center gap-2 mb-6"
      role="group"
    >
      <Pill active={selected.size === 0} onClick={onClear}>
        All
      </Pill>
      {facets.map((facet) => (
        <Pill key={facet.id} active={selected.has(facet.id)} onClick={() => onToggle(facet.id)}>
          {facet.label}
        </Pill>
      ))}
    </div>
  )
}

/**
 * ContentIndex organism — a filterable card grid for `pages` / `lectures`
 * content-index blocks. The full list is resolved server-side (SEO-friendly);
 * the visitor narrows it client-side with multi-select filter pills derived from
 * the items' own tags. Renders as a plain grid when no facets are present.
 *
 * SSR renders every card (pure `useState`, no `ClientOnly`); hydration wires up
 * the pill toggles.
 */
export function ContentIndex({ items, className = '' }: ContentIndexProps) {
  const facets = useMemo(() => deriveFacets(items), [items])
  const [selected, setSelected] = useState<Set<string>>(new Set())

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

  // Narrow to items whose tags intersect the selection (OR; empty selection
  // shows everything), then strip `tags` — ContentCard forwards unknown props
  // to the DOM.
  const gridItems = useMemo(
    () => filterByFacets(items, selected).map(({ tags: _tags, ...card }) => card),
    [items, selected],
  )

  return (
    <div className={className}>
      {facets.length > 0 && (
        <FilterPills facets={facets} selected={selected} onClear={clear} onToggle={toggle} />
      )}
      <ContentGrid items={gridItems} />
    </div>
  )
}
