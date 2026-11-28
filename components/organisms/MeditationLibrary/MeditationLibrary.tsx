import { useMemo, useState, type ComponentProps } from 'react'
import { Heading, Image, Link } from '@/components/atoms'
import { ContentGrid, FilterPills, type Facet } from '@/components/molecules'
import { choiceIndex, meditationLabel } from '@/lib/content/meditation-label'
import type {
  MeditationChoice,
  MeditationListing,
  ResolvedMeditationLibrary,
} from '@/lib/content/blocks'
import { ALL_TIMES_OF_DAY, type TimeOfDay } from '@/lib/time-of-day'
import type { TFunction } from '@/lib/i18n/i18n'
import { useT } from '@/hooks/useT'
import { useFadeOnChange } from '@/hooks/useFadeOnChange'
import { useTimeOfDaySlot } from './useTimeOfDaySlot'

/** Drawn at 56px, and at 2× on a retina screen. */
const ICON_SIZES = '56px'

/** `sizes` for one card of the grid below — three columns inside `Container xl`. */
const CARD_SIZES = '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 360px'

/** `#rgb`, `#rrggbb` and `#rrggbbaa` — what the upstream colour field stores. */
const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/**
 * A hex colour, and nothing else. The accent is editor data reaching an inline
 * style, so the shape is checked rather than trusted.
 */
function accentColor(color: string | null): string | undefined {
  return color !== null && HEX_COLOR.test(color) ? color : undefined
}

/** One (choice, slot) pair, which is one tile. */
interface Tile {
  key: string
  choice: MeditationChoice
  slot: TimeOfDay
  href: string
}

/**
 * Every tile a set of choices offers, narrowed to `slot` once the browser has
 * named one.
 *
 * With no slot — the server, and the first client render — every pair is
 * rendered: the page works without JavaScript, and a crawler sees every link.
 */
function tilesFor(
  choices: readonly MeditationChoice[],
  hrefById: Map<string, string>,
  slot: TimeOfDay | null,
): Tile[] {
  const slots = slot ? [slot] : ALL_TIMES_OF_DAY

  return choices.flatMap((choice) =>
    slots.flatMap((each) => {
      const ref = choice.slots[each]
      const href = ref === undefined ? undefined : hrefById.get(String(ref))

      return href ? [{ key: `${choice.id}-${each}`, choice, slot: each, href }] : []
    }),
  )
}

function TileRow({ tiles, label }: { tiles: Tile[]; label: string }) {
  if (tiles.length === 0) {
    return null
  }

  return (
    <>
      <Heading className="text-center" level="h2" styleAs="h3">
        {label}
      </Heading>
      {/* The row keeps one tile's height when a slot offers fewer tiles than
          the last, so narrowing never collapses the row under the list. It
          cannot absorb the hydration swap itself: the server renders all three
          slots, and no reserved height could hold three rows' worth. */}
      <ul className="mt-6 grid min-h-24 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <li key={tile.key}>
            <Link
              className="flex h-full items-center gap-4 rounded-lg border border-line p-4 transition-colors hover:bg-tint"
              href={tile.href}
              variant="unstyled"
            >
              {/* The choice record is itself the SVG, so an absent upload is an
                  accent with no icon rather than a broken image. */}
              <span
                aria-hidden="true"
                className="flex size-14 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: accentColor(tile.choice.color) }}
              >
                {tile.choice.iconUrl !== null && (
                  <Image
                    alt=""
                    aspectRatio="square"
                    className="size-8"
                    sizes={ICON_SIZES}
                    src={tile.choice.iconUrl}
                  />
                )}
              </span>
              <span className="text-fg">{tile.choice.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

export interface MeditationLibraryProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** The choices an editor picked and the meditations they name, resolved in `+data`. */
  library: ResolvedMeditationLibrary
  /**
   * Pins the time of day instead of reading the browser's own.
   *
   * `null` is the pre-mount view — every slot's tiles, which is what the server
   * renders and what a visitor without JavaScript keeps. Ladle and the keyboard
   * walk-through need each state drawable at any hour; nothing in the app
   * passes this.
   */
  timeOfDay?: TimeOfDay | null
}

/**
 * The meditation counterpart of `MusicLibrary`: two questions, then the whole
 * list of what their answers offer.
 *
 * "How are you feeling?" over the mood tiles and "How much time do you have?"
 * over the duration tiles, each tile one click from the meditation its choice
 * names for the visitor's time of day. Below them, every meditation those
 * choices name, narrowed one choice at a time by a chip row.
 *
 * Everything server-renders. The browser then narrows the tile rows to the
 * current time of day (`useTimeOfDaySlot`) and wires the chips up. So a visitor
 * without JavaScript gets every slot's links and the whole list, rather than a
 * blank region.
 *
 * An empty library is a failed or empty read, and says so: this block renders
 * its unavailable line where every other content-index type renders nothing,
 * because a page whose purpose is choosing a meditation must not be a blank
 * space.
 */
export function MeditationLibrary({
  library,
  timeOfDay,
  className = '',
  ...props
}: MeditationLibraryProps) {
  const t = useT()
  const browserSlot = useTimeOfDaySlot()
  const slot = timeOfDay === undefined ? browserSlot : timeOfDay
  const [selected, setSelected] = useState<Set<string>>(() => new Set())

  const { choices, meditations } = library
  const byId = useMemo(() => choiceIndex(choices), [choices])
  const hrefById = useMemo(
    () => new Map(meditations.map((listing) => [String(listing.id), listing.href])),
    [meditations],
  )

  const moodTiles = useMemo(
    () =>
      tilesFor(
        choices.filter((choice) => choice.kind === 'mood'),
        hrefById,
        slot,
      ),
    [choices, hrefById, slot],
  )
  const durationTiles = useMemo(
    () =>
      tilesFor(
        choices.filter((choice) => choice.kind === 'duration'),
        hrefById,
        slot,
      ),
    [choices, hrefById, slot],
  )

  const facets: Facet[] = useMemo(
    () =>
      choices.map((choice) => ({
        id: String(choice.id),
        label: choice.title,
        iconUrl: choice.iconUrl,
      })),
    [choices],
  )

  // Single-select: picking a chip replaces the selection rather than adding to
  // it, and picking the chip already in effect clears it. `FilterPills` reports
  // each chip's own state either way.
  const select = (id: string) => setSelected((prev) => (prev.has(id) ? new Set() : new Set([id])))
  const clear = () => setSelected(new Set())

  const fadeRef = useFadeOnChange(Array.from(selected).join(','))

  const cards = useMemo(() => {
    const shown =
      selected.size === 0
        ? meditations
        : meditations.filter((listing) => listing.choiceIds.some((id) => selected.has(String(id))))

    return shown.map((listing) => card(t, listing, byId))
  }, [meditations, selected, t, byId])

  if (choices.length === 0 || meditations.length === 0) {
    return (
      <section aria-label={t('meditation.a11y.finder_region')} className={className} {...props}>
        <p className="text-center text-fg-muted">{t('meditation.general.finder_unavailable')}</p>
      </section>
    )
  }

  return (
    <section aria-label={t('meditation.a11y.finder_region')} className={className} {...props}>
      <TileRow label={t('meditation.general.finder_question')} tiles={moodTiles} />
      <div className="mt-10">
        <TileRow label={t('meditation.general.length_question')} tiles={durationTiles} />
      </div>

      <Heading className="mt-12 text-center" level="h2">
        {t('meditation.general.all_meditations')}
      </Heading>
      <div className="mt-6">
        <FilterPills facets={facets} selected={selected} onClear={clear} onToggle={select} />
        <ContentGrid ref={fadeRef} headingLevel="h3" items={cards} sizes={CARD_SIZES} />
      </div>
    </section>
  )
}

/** One grid card. The title is composed, never read off the meditation. */
function card(t: TFunction, listing: MeditationListing, byId: Map<number, MeditationChoice>) {
  const title = meditationLabel(t, listing, byId)

  return {
    id: listing.id,
    title,
    href: listing.href,
    thumbnailSrc: listing.thumbnail?.url ?? '',
    // Meditation thumbnails are populated without `alt`. Fall back to the
    // composed title (`||`, so an empty alt still falls through).
    thumbnailAlt: listing.thumbnail?.alt || title,
    aspectRatio: listing.thumbnail?.aspectRatio,
    playButton: true,
    durationMinutes: listing.durationMinutes,
  }
}
