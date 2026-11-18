// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { MusicLibrary } from './MusicLibrary'
import type { MusicFilter, Track } from '../../molecules'

// Howler never plays under jsdom, so the core hook is replaced by a recorder:
// what these tests assert is which url the playlist asks it to load, and
// whether it asks for playback.
const player = vi.hoisted(() => ({ load: vi.fn() }))

vi.mock('../../../hooks/audio/useAudioPlayer', () => ({
  useAudioPlayer: () => [
    {
      isPlaying: false,
      isPaused: true,
      isLoading: false,
      isReady: true,
      currentTime: 0,
      duration: 0,
      volume: 1,
      isMuted: false,
      error: null,
    },
    {
      play: () => {},
      pause: () => {},
      togglePlayPause: () => {},
      seek: () => {},
      setVolume: () => {},
      toggleMute: () => {},
      unmute: () => {},
      load: player.load,
    },
  ],
}))

const track = (title: string, tag: string): Track => ({
  url: `https://cdn.example.com/${title.toLowerCase().replace(/ /g, '-')}.mp3`,
  title,
  credit: 'Artist',
  creditURL: 'https://example.com/artist',
  thumbnailURL: '',
  duration: 0,
  tags: [{ id: tag, label: tag }],
})

// Two facets interleave, so the second visible `wind` row is index 4, not 1.
const tracks = [
  track('Raga Malkauns', 'strings'),
  track('Persian Vibes', 'wind'),
  track('Peaceful Chants', 'vocal'),
  track('Morning Melody', 'strings'),
  track('Flute Meditation', 'wind'),
]

const filters: MusicFilter[] = [
  { id: 'strings', label: 'Strings', icon: MusicalNoteIcon },
  { id: 'wind', label: 'Wind', icon: MusicalNoteIcon },
]

const row = (title: string) => screen.getByRole('button', { name: new RegExp(title) })

/** Titles of the rows drawing the "now playing" treatment. */
const highlighted = () =>
  tracks
    .map((t) => t.title)
    .filter((title) =>
      screen.queryByRole('button', { name: new RegExp(title) })?.className.includes('bg-teal-600'),
    )

const lastLoad = () => player.load.mock.calls.at(-1)

beforeEach(() => {
  player.load.mockClear()
})

describe('MusicLibrary — the playing track has one owner', () => {
  it('loads the first track on mount without playing it', () => {
    render(<MusicLibrary filters={filters} tracks={tracks} />)

    expect(lastLoad()?.[0]).toBe(tracks[0].url)
    expect(lastLoad()?.[1]).toMatchObject({ autoplay: false })
  })

  it('plays, highlights and shows the filtered row that was clicked', () => {
    render(<MusicLibrary filters={filters} tracks={tracks} />)

    fireEvent.click(screen.getByRole('button', { name: 'Wind' }))
    fireEvent.click(row('Flute Meditation'))

    expect(lastLoad()?.[0]).toBe(tracks[4].url)
    expect(highlighted()).toEqual(['Flute Meditation'])
    expect(screen.getByRole('heading', { level: 3, name: 'Flute Meditation' })).toBeTruthy()
  })

  it('starts playback when a row is clicked on a paused player', () => {
    render(<MusicLibrary filters={filters} tracks={tracks} />)

    fireEvent.click(row('Peaceful Chants'))

    expect(lastLoad()?.[0]).toBe(tracks[2].url)
    expect(lastLoad()?.[1]).toMatchObject({ autoplay: true })
  })

  it('keeps the playing track when the filter is cleared', () => {
    render(<MusicLibrary filters={filters} tracks={tracks} />)

    fireEvent.click(screen.getByRole('button', { name: 'Wind' }))
    fireEvent.click(row('Flute Meditation'))
    const loads = player.load.mock.calls.length

    fireEvent.click(screen.getByRole('button', { name: 'Wind' }))

    expect(screen.getAllByRole('button', { name: /Artist/ })).toHaveLength(tracks.length)
    expect(highlighted()).toEqual(['Flute Meditation'])
    expect(player.load.mock.calls.length).toBe(loads)
  })
})
