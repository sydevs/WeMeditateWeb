import { ComponentProps, useState } from 'react'
import { AudioPlayer, Playlist, Track, MusicFilter } from '../../molecules'
import { Image } from '../../atoms'

export interface MusicLibraryProps extends Omit<ComponentProps<'div'>, 'children'> {
  /**
   * Array of audio tracks
   */
  tracks: Track[]

  /**
   * Array of filter categories
   */
  filters: MusicFilter[]

  /**
   * Callback when filter changes
   */
  onFilterChange?: (filterId: string | null) => void
}

/**
 * MusicLibrary organism - Full music player interface with filters, playlist, and current track art
 *
 * Layout:
 * - Mobile: Stacked (Filters → Track Art → Player → Playlist)
 * - Desktop: 2-column grid (Left: Track Art + Player, Right: Filters + Playlist)
 *
 * Features:
 * - Icon-based filtering
 * - Current track thumbnail as album art
 * - Scrollable playlist with gradient background
 * - Integrated AudioPlayer
 * - Mobile-first responsive design
 */
export function MusicLibrary({
  tracks,
  filters,
  onFilterChange,
  className = '',
  ...props
}: MusicLibraryProps) {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)

  const handleFilterClick = (filterId: string) => {
    const newFilter = selectedFilter === filterId ? null : filterId
    setSelectedFilter(newFilter)
    onFilterChange?.(newFilter)
  }

  const handleTrackClick = (index: number) => {
    setCurrentTrackIndex(index)
  }

  const currentTrack = tracks[currentTrackIndex]

  return (
    <div
      className={`w-full max-w-7xl mx-auto p-4 sm:p-6 ${className}`}
      {...props}
    >
      {/* Mobile-First: 2-Column Layout (stacks on mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Current Track Art + Player */}
        <div className="space-y-6 max-w-md mx-auto md:mx-0 p-4">
          {/* Current Track Thumbnail with Overlay */}
          <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-lg">
            <Image
              src={currentTrack.thumbnailURL}
              alt={currentTrack.title}
              className="w-full h-full"
              aspectRatio="square"
              placeholderVariant="primary"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
            {/* Track Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white truncate">
                {currentTrack.title}
              </h3>
              <a
                href={currentTrack.creditURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/90 hover:text-white truncate block mt-1"
              >
                {currentTrack.credit}
              </a>
            </div>
          </div>

          {/* Audio Player */}
          <AudioPlayer
            tracks={tracks}
            initialTrackIndex={currentTrackIndex}
            onTrackChange={setCurrentTrackIndex}
            shuffle={true}
            disabledControls={['trackInfo']}
          />
        </div>

        {/* Right Column: Playlist with Filters */}
        <div className="relative h-full md:max-h-[90vh]">
          {/* Gradient background - extended above, below, and horizontally */}
          <div className="absolute -inset-6 bg-linear-to-r from-teal-100/50 to-transparent pointer-events-none -z-10" />

          <div className="relative h-full p-6 sm:p-6 z-10">
            <Playlist
              title="Playlist"
              tracks={tracks}
              currentTrackIndex={currentTrackIndex}
              onTrackClick={handleTrackClick}
              filters={filters}
              selectedFilter={selectedFilter}
              onFilterChange={handleFilterClick}
              className="min-w-xs"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
