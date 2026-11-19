import { ComponentProps } from 'react'
import { Heading, Image, Link } from '../../atoms'
import type { MoodCard } from '../../../lib/content-blocks'
import { MEDITATIONS_INDEX_PATH } from '../../../lib/document-routes'
import { useT } from '../../../hooks/useT'
import type { TFunction } from '../../../lib/i18n'

/** Drawn at 56px, and at 2× on a retina screen. */
const ICON_SIZES = '56px'

/** `#rgb`, `#rrggbb` and `#rrggbbaa` — what the upstream colour field stores. */
const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/**
 * A hex colour, and nothing else. The accent is editor data reaching an inline
 * style, so the shape is checked rather than trusted.
 */
function accentColor(color: string | null): string | undefined {
  return color !== null && HEX_COLOR.test(color) ? color : undefined
}

/**
 * What a mood tile is called on screen: the feeling it is for and how long it
 * runs, as one parameterised key.
 *
 * `/meditations` renders the same fourteen in a plain grid, and a visitor can
 * compare the two side by side — so the name is composed once, here, rather
 * than assembled the same way in two places. Never a sentence built from a
 * visible label: only English builds one that way (`AGENTS.md`).
 */
export function moodCardLabel(t: TFunction, mood: MoodCard): string {
  return t('meditation.general.mood_meditation_label', {
    mood: mood.moodTitle,
    count: mood.durationMinutes,
  })
}

/** What makes a tile unique: a mood may name a different meditation per slot. */
export function moodCardKey(mood: MoodCard): string {
  return `${mood.moodId}-${mood.href}`
}

export interface MoodFinderProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** The featured moods for the visitor's own time of day, resolved in `+data`. */
  moods: MoodCard[]
}

/**
 * The mood finder: "How are you feeling?", one tile per featured mood that
 * offers the visitor's time of day, each a click from the meditation chosen
 * for it.
 *
 * It is not a `ContentIndex`. That organism exists to derive facets and filter
 * by them, and here there is exactly one card per mood, so the pills would
 * select nothing. It reuses `ContentGrid`'s siblings — `Link`, `Image`,
 * `Heading` — rather than its facets.
 *
 * An empty list is a failed or empty read, and says so. The `content-index`
 * converter returns `null` for an empty list everywhere else; a mood picker
 * with no moods is a blank space where the page's purpose should be.
 */
export function MoodFinder({ moods, className = '', ...props }: MoodFinderProps) {
  const t = useT()

  return (
    <section aria-label={t('meditation.a11y.finder_region')} className={className} {...props}>
      <Heading className="text-center" level="h2">
        {t('meditation.general.finder_question')}
      </Heading>

      {moods.length === 0 ? (
        <p className="mt-6 text-center text-fg-muted">
          {t('meditation.general.finder_unavailable')}
        </p>
      ) : (
        <>
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {moods.map((mood) => (
              <li key={moodCardKey(mood)}>
                <Link
                  className="flex items-center gap-4 rounded-lg border border-line p-4 transition-colors hover:bg-tint"
                  href={mood.href}
                  variant="unstyled"
                >
                  {/* The mood record is itself the SVG, so an absent upload is
                      an accent with no icon rather than a broken image. */}
                  <span
                    aria-hidden="true"
                    className="flex size-14 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: accentColor(mood.color) }}
                  >
                    {mood.iconUrl !== null && (
                      <Image
                        alt=""
                        aspectRatio="square"
                        className="size-8"
                        sizes={ICON_SIZES}
                        src={mood.iconUrl}
                      />
                    )}
                  </span>
                  <span className="text-fg">{moodCardLabel(t, mood)}</span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-center">
            <Link href={MEDITATIONS_INDEX_PATH}>{t('meditation.general.all_meditations')}</Link>
          </p>
        </>
      )}
    </section>
  )
}
