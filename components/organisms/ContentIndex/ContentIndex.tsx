import { useMemo, useState } from 'react'
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

const PILL_BASE =
  'inline-flex items-center justify-center min-h-11 min-w-11 px-4 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2'

/** Pill classes for the given active state (teal when active, muted otherwise). */
function pillClassName(active: boolean): string {
  return `${PILL_BASE} ${
    active ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }`
}

interface FilterPillsProps {
  facets: Facet[]
  /** Selected facet ids; empty means "All". */
  selected: Set<string>
  onToggle: (id: string) => void
  onClear: () => void
}

/**
 * Filter pill row: an "All" pill plus one toggle per facet. Multi-select with OR
 * semantics; "All" clears the selection. Kept internal — extract a reusable
 * `FilterPills` molecule only when a second consumer appears.
 */
function FilterPills({ facets, selected, onToggle, onClear }: FilterPillsProps) {
  const allActive = selected.size === 0

  return (
    <div
      aria-label="Filter content by tag"
      className="flex flex-wrap justify-center gap-2 mb-6"
      role="group"
    >
      <button
        aria-pressed={allActive}
        className={pillClassName(allActive)}
        type="button"
        onClick={onClear}
      >
        All
      </button>
      {facets.map((facet) => {
        const active = selected.has(facet.id)

        return (
          <button
            key={facet.id}
            aria-pressed={active}
            className={pillClassName(active)}
            type="button"
            onClick={() => onToggle(facet.id)}
          >
            {facet.label}
          </button>
        )
      })}
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
