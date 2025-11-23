import type { Story, StoryDefault } from '@ladle/react'
import { MusicLibrary } from './MusicLibrary'
import { Track, MusicFilter } from '../../molecules'
import {
  MusicalNoteIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/outline'

export default {
  title: 'Organisms',
} satisfies StoryDefault

// Sample audio tracks
const sampleTracks: Track[] = [
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    title: 'Raga Malkauns',
    credit: 'Koushik Aithal',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/track1/800/800',
    duration: 196,
    tags: ['strings'],
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    title: 'Persian Vibes',
    credit: 'Rishi Nair',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/track2/800/800',
    duration: 242,
    tags: ['wind'],
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    title: 'Peaceful Chants',
    credit: 'Sarah Chen',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/track3/800/800',
    duration: 318,
    tags: ['vocal'],
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    title: 'Morning Melody',
    credit: 'David Martinez',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/track4/800/800',
    duration: 281,
    tags: ['strings'],
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    title: 'Flute Meditation',
    credit: 'Anna Schmidt',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/track5/800/800',
    duration: 224,
    tags: ['wind'],
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    title: 'Om Chanting',
    credit: 'Rajesh Kumar',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/track6/800/800',
    duration: 267,
    tags: ['vocal'],
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    title: 'Bamboo Wind',
    credit: 'Li Wei',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/track7/800/800',
    duration: 193,
    tags: ['wind'],
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    title: 'String Symphony',
    credit: 'Elena Popov',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/track8/800/800',
    duration: 305,
    tags: ['strings'],
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    title: 'Sacred Mantras',
    credit: 'Priya Sharma',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/track9/800/800',
    duration: 289,
    tags: ['vocal'],
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    title: 'Sitar Dreams',
    credit: 'Arjun Patel',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/track10/800/800',
    duration: 254,
    tags: ['strings'],
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
    title: 'Desert Winds',
    credit: 'Fatima Hassan',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/track11/800/800',
    duration: 276,
    tags: ['wind'],
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
    title: 'Gregorian Echoes',
    credit: 'Thomas Mueller',
    creditURL: '#',
    thumbnailURL: 'https://picsum.photos/seed/track12/800/800',
    duration: 312,
    tags: ['vocal'],
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
 * MusicLibrary organism showcasing full music player interface with filters, playlist, and current track art.
 */
export const Default: Story = () => (
  <>
    <MusicLibrary
      tracks={sampleTracks}
      filters={musicFilters}
    />
  </>
)

Default.storyName = 'Music Library'
