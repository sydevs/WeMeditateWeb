import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from '@/components/atoms'
import type { ResolvedMood } from '@/lib/content/blocks'
import { ALL_TIMES_OF_DAY, timeOfDaySlot, type TimeOfDay } from '@/lib/time-of-day'

export interface MoodPickerProps {
  /** The featured moods resolved in `+data`, each with its per-slot meditation. */
  moods: ResolvedMood[]
  /**
   * The slot the server resolved from the visitor's Cloudflare zone. `null`
   * where it had none, which shows every mood until the browser narrows them.
   */
  serverSlot?: TimeOfDay | null
  className?: string
}

/** One tile: a mood and the meditation this slot opens for it. */
interface MoodTile {
  mood: ResolvedMood
  href: string
}

/**
 * The tiles to draw for a slot.
 *
 * A mood with no meditation in the slot gets none — upstream fills exactly one
 * slot on each featured mood, so a visitor sees a different set morning,
 * afternoon and evening. With no slot to narrow by, every mood is offered at
 * its own earliest filled slot, which is what the server sends when it could
 * not read the visitor's zone.
 */
export function moodsForSlot(moods: ResolvedMood[], slot: TimeOfDay | null): MoodTile[] {
  const tiles: MoodTile[] = []

  for (const mood of moods) {
    const href =
      slot === null
        ? ALL_TIMES_OF_DAY.map((each) => mood.slots[each]).find(Boolean)
        : mood.slots[slot]

    if (href !== undefined) tiles.push({ mood, href })
  }

  return tiles
}

/**
 * The visitor's own time of day, or `null` until the browser has told us.
 *
 * ⚠ **`null` on the first render is load-bearing, not a loading state.** The
 * server resolved a slot from Cloudflare's view of the visitor's zone, and that
 * is what the HTML carries — so this must answer `null` on the render that
 * hydrates it, or the two disagree on the markup. It then confirms the server's
 * guess, and the picker swaps only where the two differ.
 *
 * It stays `null` when `Intl` cannot answer, which leaves the server's slot
 * standing rather than replacing it with a guess.
 */
function useTimeOfDaySlot(): TimeOfDay | null {
  const [slot, setSlot] = useState<TimeOfDay | null>(null)

  useEffect(() => {
    try {
      // eslint-disable-next-line @eslint-react/set-state-in-effect -- the zone exists only in the browser, so running this any earlier would make the server and the client render different markup
      setSlot(
        timeOfDaySlot(Intl.DateTimeFormat().resolvedOptions().timeZone || undefined, new Date()),
      )
    } catch {
      // `Intl` will not name a zone, so the server's slot stands.
    }
  }, [])

  return slot
}

/** The icon, drawn as a mask so the mood's own colour fills it. */
function maskStyle(iconUrl: string): CSSProperties {
  return {
    maskImage: `url("${iconUrl}")`,
    WebkitMaskImage: `url("${iconUrl}")`,
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
  }
}

/**
 * The app's mood screen, on the web: one round tile per featured mood that has
 * a meditation for the visitor's time of day, each a link straight to it.
 *
 * ⚠ **The icons are SahajCloud SVGs drawn in `currentColor`, so a plain `<img>`
 * renders them black.** Each is a CSS mask filled with the mood's own colour
 * instead, which is why `assets.sydevelopers.com` has to answer a cross-origin
 * request for them; until it does, the circles draw empty.
 *
 * It adds no wording of its own: the heading is the page's own lexical content
 * and each tile shows the mood's own title, already in the page's language.
 */
export function MoodPicker({ moods, serverSlot = null, className = '' }: MoodPickerProps) {
  // `null` until the browser answers, so the first render matches the server's
  // (see `useTimeOfDaySlot`). It then confirms or corrects the slot.
  const browserSlot = useTimeOfDaySlot()
  const tiles = moodsForSlot(moods, browserSlot ?? serverSlot)

  if (tiles.length === 0) {
    return null
  }

  return (
    <ul className={`grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-3 ${className}`}>
      {tiles.map(({ mood, href }) => (
        <li key={mood.id} className="flex justify-center">
          <Link
            className="group focus-ring flex w-42 max-w-full flex-col items-center gap-2 rounded-lg py-2"
            href={href}
            style={{ '--mood-color': mood.color ?? 'var(--color-teal-600)' } as CSSProperties}
            variant="unstyled"
          >
            {/* 80px around a 64px circle, as the app's own tile has it. */}
            <span className="flex size-20 items-center justify-center">
              <span className="bg-tint flex size-16 items-center justify-center rounded-full transition-colors group-hover:bg-[var(--mood-color)] group-focus-visible:bg-[var(--mood-color)]">
                {mood.iconUrl === null ? null : (
                  <span
                    aria-hidden="true"
                    className="size-8 bg-[var(--mood-color)] transition-colors group-hover:bg-white group-focus-visible:bg-white"
                    style={maskStyle(mood.iconUrl)}
                  />
                )}
              </span>
            </span>
            <span className="text-fg text-center text-sm">{mood.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
