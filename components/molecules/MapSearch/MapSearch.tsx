import { MapPinIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/atoms/Button'
import { LocationSearch, type SelectedLocation } from '@/components/molecules/LocationSearch'
import { useLocale } from '@/hooks/usePageContext'
import { useT } from '@/hooks/useT'
import { MAP_PREFIX } from '@/lib/atlas/route'
import { classMapSearchHref } from '@/lib/urls/urls'

export interface MapSearchProps {
  /**
   * The editor's wording: the search's visible label, and the link to the
   * class map that a visitor without JavaScript gets in its place. Without it
   * the field is named for screen readers only, and the link falls back to
   * `discover.general.classes_near_me`.
   */
  label?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * A place search that opens the class map around the place a visitor picks:
 * what the Splash block's `map-search` layout holds.
 *
 * @example
 * <MapSearch label="Find a class near you" />
 */
export function MapSearch({ label, className = '' }: MapSearchProps) {
  const locale = useLocale()
  const t = useT()
  // An emptied SahajCloud field arrives as '', which would render an empty
  // label and drop the field's screen-reader name.
  const wording = label?.trim() || undefined

  // A full load, not a client navigation: the atlas widget reads its route
  // from the URL it boots on.
  const openMap = (place: SelectedLocation) => {
    window.location.assign(classMapSearchHref(locale, place))
  }

  const fallback = (
    <Button fullWidth href={MAP_PREFIX} icon={MapPinIcon} variant="neutral">
      {wording ?? t('discover.general.classes_near_me')}
    </Button>
  )

  // The label rather than the placeholder carries the wording: the
  // placeholder's grey is held under 4.5:1 on the strength of a visible label
  // beside every field (DESIGN_SYSTEM.md, #199). The minimum height is the
  // search's own (a one-line label, its margin and the 50px field), so the
  // splash content around it does not jump when it replaces the fallback.
  return (
    <div
      className={`mx-auto flex w-full max-w-md flex-col justify-center text-left ${wording ? 'min-h-24' : 'min-h-12.5'} ${className}`}
    >
      <LocationSearch
        fallback={fallback}
        label={
          wording && (
            <span className="mb-4 block text-center text-lg font-light text-fg md:text-xl">
              {wording}
            </span>
          )
        }
        onLocationSelect={openMap}
      />
    </div>
  )
}
