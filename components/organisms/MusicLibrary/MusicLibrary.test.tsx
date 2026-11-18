// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { MusicLibrary } from './MusicLibrary'
import type { MusicFilter, Track } from '../../molecules'
import type { AudioPlayerControls, AudioPlayerState } from '../../../hooks/audio'

// Howler never plays under jsdom, so the core hook is replaced by a recorder.
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
    } satisfies AudioPlayerState,
    { load: player.load } satisfies Partial<AudioPlayerControls>,
  ],
}))

const track = (title: string, tag: string): Track => ({
  url: `https://cdn.example.com/${title}.mp3`,
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
const toggleWind = () => fireEvent.click(screen.getByRole('button', { name: 'Wind' }))

const highlighted = () =>
  screen
    .queryAllByRole('button', { current: true })
    .map((button) => button.querySelector('h4')?.textContent)

const lastLoad = () => {
  const [url, options] = player.load.mock.calls.at(-1) ?? []

  return { url, autoplay: options?.autoplay }
}

beforeEach(() => {
  player.load.mockClear()
})

describe('MusicLibrary — the playing track has one owner', () => {
  it('loads the first track on mount without playing it', () => {
    render(<MusicLibrary filters={filters} tracks={tracks} />)

    expect(lastLoad()).toEqual({ url: tracks[0].url, autoplay: false })
  })

  it('plays, highlights and shows the filtered row clicked on a paused player', () => {
    render(<MusicLibrary filters={filters} tracks={tracks} />)

    toggleWind()
    fireEvent.click(row('Flute Meditation'))

    expect(lastLoad()).toEqual({ url: tracks[4].url, autoplay: true })
    expect(highlighted()).toEqual(['Flute Meditation'])
    expect(screen.getByRole('heading', { level: 3, name: 'Flute Meditation' })).toBeTruthy()
  })

  it('keeps the playing track when the filter is cleared', () => {
    render(<MusicLibrary filters={filters} tracks={tracks} />)

    toggleWind()
    fireEvent.click(row('Flute Meditation'))
    const loads = player.load.mock.calls.length

    toggleWind()

    expect(screen.getAllByRole('button', { name: /Artist/ })).toHaveLength(tracks.length)
    expect(highlighted()).toEqual(['Flute Meditation'])
    expect(player.load.mock.calls.length).toBe(loads)
  })
})
