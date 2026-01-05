import { ComponentProps } from 'react'
import { Link, Button } from '../../atoms'
import type { Track } from '../AudioPlayer/types'
import type { HeroIcon } from '../../atoms/Icon/Icon'

export interface MusicFilter {
  /**
   * Filter identifier (e.g., 'strings', 'vocal', 'wind')
   */
  id: string

  /**
   * Display label for the filter
   */
  label: string

  /**
   * Icon component from Heroicons
   */
  icon: HeroIcon
}

export interface PlaylistProps extends Omit<ComponentProps<'div'>, 'children'> {
  /**
   * Playlist title
   */
  title: string

  /**
   * Array of audio tracks
   */
  tracks: Track[]

  /**
   * Index of the currently playing track
   */
  currentTrackIndex: number

  /**
   * Callback when a track is clicked
   */
  onTrackClick: (index: number) => void

  /**
   * Optional array of filter categories
   */
  filters?: MusicFilter[]

  /**
   * Currently selected filter ID
   */
  selectedFilter?: string | null

  /**
   * Callback when filter changes
   */
  onFilterChange?: (filterId: string) => void
}

/**
 * PlaylistItem subcomponent - Individual track item in the playlist
 */
interface PlaylistItemProps {
  track: Track
  index: number
  isCurrentTrack: boolean
  onTrackClick: (index: number) => void
}

function PlaylistItem({ track, index, isCurrentTrack, onTrackClick }: PlaylistItemProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <button
      onClick={() => onTrackClick(index)}
      className={`w-full text-left p-3 rounded transition-all cursor-pointer ${
        isCurrentTrack
          ? 'bg-teal-600 text-white shadow-md'
          : 'bg-white/80 hover:bg-gray-100 text-gray-900'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h4 className="text-sm font-medium truncate">
            {track.title}
          </h4>
          <Link
            href={track.creditURL}
            external
            variant={isCurrentTrack ? 'unstyled' : 'primary'}
            size="inherit"
            className={`text-xs truncate self-start mt-1 ${
              isCurrentTrack
                ? 'text-teal-100 hover:text-white'
                : ''
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {track.credit}
          </Link>
        </div>
        <span
          className={`text-sm font-number font-medium whitespace-nowrap flex items-center ${
            isCurrentTrack ? 'text-teal-100' : 'text-gray-600'
          }`}
        >
          {formatDuration(track.duration)}
        </span>
      </div>
    </button>
  )
}

/**
 * Playlist molecule - Displays a scrollable list of audio tracks
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
  // Filter tracks based on selected filter using tags
  const filteredTracks = selectedFilter
    ? tracks.filter((track) => track.tags?.includes(selectedFilter))
    : tracks

  return (
    <div
      className={`relative h-full flex flex-col ${className}`}
      {...props}
    >
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
                icon={filter.icon}
                variant={selectedFilter === filter.id ? 'primary' : 'ghost'}
                size="xs"
                shape="circular"
                onClick={() => onFilterChange?.(filter.id)}
                aria-pressed={selectedFilter === filter.id}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Playlist items */}
      <div className="relative flex-1 overflow-y-auto space-y-2">
        {filteredTracks.map((track, index) => (
          <PlaylistItem
            key={index}
            track={track}
            index={index}
            isCurrentTrack={index === currentTrackIndex}
            onTrackClick={onTrackClick}
          />
        ))}
      </div>
    </div>
  )
}
