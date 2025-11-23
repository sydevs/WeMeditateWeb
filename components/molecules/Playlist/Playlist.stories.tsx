import type { Story, StoryDefault } from '@ladle/react'
import { Playlist, MusicFilter } from './Playlist'
import { Track } from '../AudioPlayer/useAudioPlayer'
import { StoryWrapper, StorySection } from '../../ladle'
import {
  MusicalNoteIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'

export default {
  title: 'Molecules / Audio',
} satisfies StoryDefault

// Sample audio tracks
const sampleTracks: Track[] = [
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    title: 'Raga Malkauns',
    credit: 'Koushik Aithal',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/track1/200/200',
    duration: 196,
    tags: ['strings'],
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    title: 'Persian Vibes',
    credit: 'Rishi Nair',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/track2/200/200',
    duration: 242,
    tags: ['wind'],
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    title: 'Peaceful Chants',
    credit: 'Sarah Chen',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/track3/200/200',
    duration: 318,
    tags: ['vocal'],
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    title: 'Morning Melody',
    credit: 'David Martinez',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/track4/200/200',
    duration: 281,
    tags: ['strings'],
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    title: 'Flute Meditation',
    credit: 'Anna Schmidt',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/track5/200/200',
    duration: 224,
    tags: ['wind'],
  },
]

// Extended tracks for scrollable example
const extendedTracks: Track[] = [
  ...sampleTracks,
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    title: 'Om Chanting',
    credit: 'Rajesh Kumar',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/track6/200/200',
    duration: 267,
    tags: ['vocal'],
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    title: 'Bamboo Wind',
    credit: 'Li Wei',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/track7/200/200',
    duration: 193,
    tags: ['wind'],
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    title: 'String Symphony',
    credit: 'Elena Popov',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/track8/200/200',
    duration: 305,
    tags: ['strings'],
  },
]

// Sample filters
const musicFilters: MusicFilter[] = [
  {
    id: 'strings',
    label: 'Strings',
    icon: MusicalNoteIcon,
  },
  {
    id: 'vocal',
    label: 'Vocal',
    icon: MicrophoneIcon,
  },
  {
    id: 'wind',
    label: 'Wind',
    icon: SpeakerWaveIcon,
  },
]

/**
 * Playlist molecule showcasing track list with filters and current track highlighting.
 */
export const Default: Story = () => {
  const [currentTrack, setCurrentTrack] = useState(0)
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)
  const [scrollableCurrentTrack, setScrollableCurrentTrack] = useState(0)

  return (
    <StoryWrapper>
      <StorySection title="Basic">
        <div className="max-w-md">
          <Playlist
            title="Meditation Music"
            tracks={sampleTracks}
            currentTrackIndex={currentTrack}
            onTrackClick={setCurrentTrack}
            filters={musicFilters}
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
          />
        </div>
      </StorySection>

      <StorySection title="Scrollable">
        <div className="max-w-md h-96">
          <Playlist
            title="Extended Collection"
            tracks={extendedTracks}
            currentTrackIndex={scrollableCurrentTrack}
            onTrackClick={setScrollableCurrentTrack}
          />
        </div>
      </StorySection>

      <StorySection title="Music Library" inContext={true}>
        <div className="bg-gradient-to-br from-teal-50 to-blue-50 p-8">
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Guided Meditation Sessions
            </h2>
            <Playlist
              title="Featured Tracks"
              tracks={sampleTracks}
              currentTrackIndex={currentTrack}
              onTrackClick={setCurrentTrack}
            />
          </div>
        </div>
      </StorySection>

      <div />
    </StoryWrapper>
  )
}

Default.storyName = 'Playlist'
