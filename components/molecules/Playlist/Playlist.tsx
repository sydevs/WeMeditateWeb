import { ComponentProps, useId } from 'react'
import { Link, Button } from '@/components/atoms'
import type { Track } from '@/lib/media/audio'
import type { HeroIcon } from '@/components/atoms/Icon/Icon'
import { formatDuration } from '@/lib/media/duration'

export interface MusicFilter {
  /** Filter identifier, for example 'strings', 'vocal', 'wind' */
  id: string

  /** Display label for the filter */
  label: string

  /** Icon component from Heroicons */
  icon: HeroIcon
}

export interface PlaylistProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Playlist title */
  title: string

  /** Array of audio tracks */
  tracks: Track[]

  /** Index of the currently playing track */
  currentTrackIndex: number

  /** Callback when a track is clicked */
  onTrackClick: (index: number) => void

  /** Optional array of filter categories */
  filters?: MusicFilter[]

  /** Currently selected filter ID */
  selectedFilter?: string | null

  /** Callback when filter changes */
  onFilterChange?: (filterId: string) => void
}

/**
 * Pair each track with its index in `tracks`, keeping only the ones the filter
 * matches.
 *
 * The index has to travel with the track: `currentTrackIndex` and
 * `onTrackClick` both index `tracks`, while a filtered row's position in the
 * rendered list is its own. Reading one as the other plays and highlights the
 * wrong track (#249).
 */
export function visibleTracks(
  tracks: Track[],
  selectedFilter?: string | null,
): { track: Track; index: number }[] {
  return tracks
    .map((track, index) => ({ track, index }))
    .filter(({ track }) => !selectedFilter || track.tags?.some((tag) => tag.id === selectedFilter))
}

/** PlaylistItem is a subcomponent: an individual track item in the playlist. */
interface PlaylistItemProps {
  track: Track
  index: number
  isCurrentTrack: boolean
  onTrackClick: (index: number) => void
}

function PlaylistItem({ track, index, isCurrentTrack, onTrackClick }: PlaylistItemProps) {
  const titleId = useId()

  // The play button and the credit link are siblings, never one inside the
  // other (axe `nested-interactive`, #289). The button covers the whole row,
  // so a click anywhere on it still plays; the link is positioned too, and
  // later in the tree, so it paints above the button and takes its own clicks.
  return (
    <div
      className={`relative p-3 rounded transition-all ${
        isCurrentTrack
          ? 'bg-teal-700 text-white shadow-md'
          : 'bg-white/80 hover:bg-gray-100 text-gray-900'
      }`}
    >
      <button
        aria-current={isCurrentTrack ? 'true' : undefined}
        aria-labelledby={titleId}
        className="absolute inset-0 rounded cursor-pointer focus-ring"
        onClick={() => onTrackClick(index)}
      />
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h4 className="text-sm font-medium truncate" id={titleId}>
            {track.title}
          </h4>
          <Link
            external
            className={`relative text-xs truncate self-start mt-1 ${
              isCurrentTrack ? 'text-teal-50 hover:text-white transition-colors duration-200' : ''
            }`}
            href={track.creditURL}
            size="inherit"
            variant={isCurrentTrack ? 'unstyled' : 'primary'}
          >
            {track.credit}
          </Link>
        </div>
        {/* `0:00` is worse than a blank where SahajCloud stores no duration. */}
        {track.duration > 0 && (
          <span
            className={`text-sm font-number font-medium whitespace-nowrap flex items-center ${
              isCurrentTrack ? 'text-teal-50' : 'text-gray-700'
            }`}
          >
            {formatDuration(track.duration)}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Playlist is a molecule that displays a scrollable list of audio tracks.
 *
 * Features:
 * - Current track highlighting
 * - Track info with linked credits
 * - Duration display
 * - Optional filters
 * - Scrollable track list
 */
export function Playlist({
  title,
  tracks,
  currentTrackIndex,
  onTrackClick,
  filters,
  selectedFilter,
  onFilterChange,
  className = '',
  ...props
}: PlaylistProps) {
  return (
    <div className={`relative h-full flex flex-col ${className}`} {...props}>
      {/* Playlist header */}
      <div className="relative mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      {/* Filters row (if provided) */}
      {filters && filters.length > 0 && (
        <div className="relative mb-4">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                aria-pressed={selectedFilter === filter.id}
                icon={filter.icon}
                shape="circular"
                size="xs"
                variant={selectedFilter === filter.id ? 'primary' : 'ghost'}
                onClick={() => onFilterChange?.(filter.id)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* A scroll container clips at its padding box, and each row's focus
          ring draws 4px outside it: `p-1` makes that room, `-m-1` keeps the
          rows where they were. */}
      <div className="relative flex-1 overflow-y-auto space-y-2 -m-1 p-1">
        {visibleTracks(tracks, selectedFilter).map(({ track, index }) => (
          <PlaylistItem
            // shortcut: Track carries no id, so the audio url stands in as the
            // row's identity; give it one if two songs ever share an upload.
            key={track.url}
            index={index}
            isCurrentTrack={index === currentTrackIndex}
            track={track}
            onTrackClick={onTrackClick}
          />
        ))}
      </div>
    </div>
  )
}
