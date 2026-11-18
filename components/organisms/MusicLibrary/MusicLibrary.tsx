import { ComponentProps, useState } from 'react'
import { AudioPlayerProvider } from 'react-use-audio-player'
import { AudioPlayer, Playlist, Track, MusicFilter } from '../../molecules'
import { usePlaylistAudioPlayer } from '../../../hooks/audio'
import { useT } from '../../../hooks/useT'
import { Image, Link } from '../../atoms'

export interface MusicLibraryProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Array of audio tracks */
  tracks: Track[]

  /** Array of filter categories */
  filters: MusicFilter[]

  /** Callback when filter changes */
  onFilterChange?: (filterId: string | null) => void
}

/**
 * MusicLibrary is an organism: a full music player interface with filters,
 * a playlist, and current track art.
 *
 * Layout:
 * - Mobile: Stacked (Filters → Track Art → Player → Playlist)
 * - Desktop: 2-column grid — left: Track Art and Player, right: Filters and Playlist
 *
 * Features:
 * - Icon-based filtering
 * - Current track thumbnail as album art
 * - Scrollable playlist with gradient background
 * - Integrated AudioPlayer
 * - Mobile-first responsive design
 */
function MusicLibraryInner({
  tracks,
  filters,
  onFilterChange,
  className = '',
  ...props
}: MusicLibraryProps) {
  const t = useT()
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)
  const [state, controls] = usePlaylistAudioPlayer({ tracks, shuffle: true })

  const handleFilterClick = (filterId: string) => {
    const newFilter = selectedFilter === filterId ? null : filterId

    setSelectedFilter(newFilter)
    onFilterChange?.(newFilter)
  }

  const currentTrack = state.currentTrack

  return (
    <div className={`w-full max-w-7xl mx-auto p-4 sm:p-6 ${className}`} {...props}>
      {/* Mobile-First: 2-Column Layout (stacks on mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Current Track Art + Player */}
        <div className="space-y-6 max-w-md mx-auto md:mx-0 p-4">
          {/* Current Track Thumbnail with Overlay */}
          <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-lg">
            <Image
              alt={currentTrack.title}
              aspectRatio="square"
              className="w-full h-full"
              placeholderVariant="primary"
              // The column is `max-w-md` less its own `p-4`, so the art caps at
              // 416px — but only once the two-column grid is wide enough. A flat
              // 448px would claim that width at `md`, where the column is 316px,
              // and fetch 800 where 400 does.
              sizes="(min-width: 968px) 416px, (min-width: 768px) calc(50vw - 68px), (min-width: 448px) 416px, calc(100vw - 64px)"
              src={currentTrack.thumbnailURL}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
            {/* Track Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white truncate">
                {currentTrack.title}
              </h3>
              <Link
                external
                className="text-sm text-white/90 hover:text-white truncate block mt-1 transition-colors duration-200"
                href={currentTrack.creditURL}
                variant="unstyled"
              >
                {currentTrack.credit}
              </Link>
            </div>
          </div>

          {/* Audio Player */}
          <AudioPlayer
            controls={controls}
            disabledControls={['trackInfo', 'shuffle']}
            state={state}
          />
        </div>

        {/* Right Column: Playlist with Filters */}
        <div className="relative h-full md:max-h-[90vh]">
          {/* Gradient background - extended above, below, and horizontally */}
          <div className="absolute -inset-6 bg-linear-to-r from-teal-100/50 to-transparent pointer-events-none -z-10" />

          <div className="relative h-full p-6 md:pr-10 z-10">
            <Playlist
              className="min-w-xs"
              currentTrackIndex={state.currentTrackIndex}
              filters={filters}
              selectedFilter={selectedFilter}
              title={t('media.general.playlist')}
              tracks={tracks}
              onFilterChange={handleFilterClick}
              onTrackClick={controls.selectTrack}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/** MusicLibrary with the AudioPlayerProvider its player hook needs */
export function MusicLibrary(props: MusicLibraryProps) {
  return (
    <AudioPlayerProvider>
      <MusicLibraryInner {...props} />
    </AudioPlayerProvider>
  )
}
