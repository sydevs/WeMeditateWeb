import { Button, Image } from '@/components/atoms'
import { useT } from '@/hooks/useT'

/** A filter facet — the id is matched against an item's own tags. */
export interface Facet {
  id: string
  label: string
  /** An SVG the upstream record carries. Decorative: the label names the pill. */
  iconUrl?: string | null
}

export interface FilterPillsProps {
  facets: Facet[]
  /** Selected facet ids. An empty set means "All". */
  selected: Set<string>
  onToggle: (id: string) => void
  onClear: () => void
  /** Overrides the group's own screen-reader label. */
  'aria-label'?: string
  className?: string
}

/** Drawn at 20px, and at 2× on a retina screen. */
const ICON_SIZES = '20px'

/** A toggle pill built on the Button atom (square, primary when active). */
function Pill({
  active,
  iconUrl,
  onClick,
  children,
}: {
  active: boolean
  iconUrl?: string | null
  onClick: () => void
  children: string
}) {
  return (
    <Button
      aria-pressed={active}
      shape="square"
      size="sm"
      variant={active ? 'primary' : 'ghost'}
      onClick={onClick}
    >
      {iconUrl ? (
        <span className="inline-flex items-center gap-2">
          <Image
            alt=""
            aspectRatio="square"
            className="size-5 shrink-0"
            sizes={ICON_SIZES}
            src={iconUrl}
          />
          {children}
        </span>
      ) : (
        children
      )}
    </Button>
  )
}

/**
 * A filter pill row: an "All" pill, plus one toggle per facet. "All" clears the
 * selection, and an empty selection is what shows every item.
 *
 * Extracted from `ContentIndex`, which had it inline until a second consumer
 * appeared. `MeditationLibrary` is that consumer, and it brought the per-pill
 * icon with it.
 *
 * ⚠ **Single- or multi-select is the caller's, not a mode here.** The row
 * reports each pill's own state through `aria-pressed` either way; what differs
 * is whether `onToggle` adds to the selection or replaces it. Keeping that in
 * the caller is what lets `ContentIndex` stay multi-select and the library
 * single-select with one row between them.
 *
 * It renders on the server with every pill present, so a visitor without
 * JavaScript sees the whole unfiltered list rather than a row that does
 * nothing — the caller renders every item and narrows after mount.
 */
export function FilterPills({
  facets,
  selected,
  onToggle,
  onClear,
  'aria-label': ariaLabel,
  className = '',
}: FilterPillsProps) {
  const t = useT()

  return (
    <div
      aria-label={ariaLabel ?? t('article.a11y.filter_label')}
      className={`flex flex-wrap justify-center gap-2 mb-6 ${className}`}
      role="group"
    >
      <Pill active={selected.size === 0} onClick={onClear}>
        {t('article.general.filter_all')}
      </Pill>
      {facets.map((facet) => (
        <Pill
          key={facet.id}
          active={selected.has(facet.id)}
          iconUrl={facet.iconUrl}
          onClick={() => onToggle(facet.id)}
        >
          {facet.label}
        </Pill>
      ))}
    </div>
  )
}
