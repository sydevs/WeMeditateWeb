// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
// Aliased: `render` below is this file's own SSR helper.
import { render as renderInDom, screen, fireEvent } from '@testing-library/react'
import axe from 'axe-core'
import { Playlist, visibleTracks, type MusicFilter } from './Playlist'
import type { Track } from '@/lib/media/audio'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'

// `tags[].id` is the SongTag slug, which is also the `MusicFilter.id` a pill
// reports — verified against `contentIndexTrack` in lib/content/blocks.ts and
// `songMusicFilters` in components/organisms/RichText/blockConverters.tsx.
// The two facets interleave, so a filtered row's position in the rendered list
// never matches its position here.
const tracks: Track[] = [
  {
    url: 'https://cdn.example.com/raga.mp3',
    title: 'Raga Malkauns',
    credit: 'Koushik Aithal',
    creditURL: 'https://example.com/koushik',
    thumbnailURL: '',
    duration: 196,
    tags: [{ id: 'strings', label: 'Strings' }],
  },
  {
    url: 'https://cdn.example.com/persian.mp3',
    title: 'Persian Vibes',
    credit: 'Rishi Nair',
    creditURL: 'https://example.com/rishi',
    thumbnailURL: '',
    duration: 242,
    tags: [{ id: 'wind', label: 'Wind' }],
  },
  {
    url: 'https://cdn.example.com/chants.mp3',
    title: 'Peaceful Chants',
    credit: 'Sarah Chen',
    creditURL: 'https://example.com/sarah',
    thumbnailURL: '',
    duration: 318,
    tags: [{ id: 'vocal', label: 'Vocal' }],
  },
  {
    url: 'https://cdn.example.com/morning.mp3',
    title: 'Morning Melody',
    credit: 'David Martinez',
    creditURL: 'https://example.com/david',
    thumbnailURL: '',
    duration: 281,
    tags: [{ id: 'strings', label: 'Strings' }],
  },
  {
    url: 'https://cdn.example.com/flute.mp3',
    title: 'Flute Meditation',
    credit: 'Anna Schmidt',
    creditURL: 'https://example.com/anna',
    thumbnailURL: '',
    duration: 224,
    tags: [{ id: 'wind', label: 'Wind' }],
  },
]

const filters: MusicFilter[] = [
  { id: 'strings', label: 'Strings', icon: MusicalNoteIcon },
  { id: 'vocal', label: 'Vocal', icon: MusicalNoteIcon },
  { id: 'wind', label: 'Wind', icon: MusicalNoteIcon },
]

interface Row {
  title: string
  playing: boolean
}

/**
 * The track rows in render order, each with whether `aria-current` marks it as
 * the playing one. A filter pill is a `<button>` too, so rows are the ones
 * carrying a track title.
 */
function trackRows(html: string): Row[] {
  return html
    .split('<button')
    .slice(1)
    .filter((chunk) => chunk.includes('<h4'))
    .map((chunk) => ({
      title: chunk.match(/<h4[^>]*>([^<]*)<\/h4>/)?.[1] ?? '',
      playing: chunk.slice(0, chunk.indexOf('>')).includes('aria-current="true"'),
    }))
}

const playingTitles = (rows: Row[]) => rows.filter((row) => row.playing).map((row) => row.title)

function markup(
  selectedFilter: string | null,
  currentTrackIndex: number,
  list: Track[] = tracks,
): string {
  return renderToStaticMarkup(
    <Playlist
      currentTrackIndex={currentTrackIndex}
      filters={filters}
      selectedFilter={selectedFilter}
      title="Meditation Music"
      tracks={list}
      onTrackClick={() => {}}
    />,
  )
}

function render(selectedFilter: string | null, currentTrackIndex: number): Row[] {
  return trackRows(markup(selectedFilter, currentTrackIndex))
}

describe('visibleTracks — the index a row reports when clicked', () => {
  it('reports the index each visible row carries in the full track list', () => {
    expect(visibleTracks(tracks, 'wind').map(({ track, index }) => [track.title, index])).toEqual([
      ['Persian Vibes', 1],
      ['Flute Meditation', 4],
    ])
  })

  it('reports every track in order with no filter', () => {
    expect(visibleTracks(tracks, null).map(({ index }) => index)).toEqual([0, 1, 2, 3, 4])
  })

  it('drops a track carrying no tags once a filter is set', () => {
    const untagged: Track[] = [{ ...tracks[0], tags: undefined }, tracks[1]]

    expect(visibleTracks(untagged, 'wind').map(({ index }) => index)).toEqual([1])
  })

  it('reports nothing for a filter no track matches', () => {
    expect(visibleTracks(tracks, 'brass')).toEqual([])
  })
})

describe('Playlist highlighting under a filter', () => {
  it('renders the matching tracks, and highlights none when the playing one is hidden', () => {
    // 0 is Raga Malkauns, which the wind filter hides.
    const rows = render('wind', 0)

    expect(rows.map((row) => row.title)).toEqual(['Persian Vibes', 'Flute Meditation'])
    expect(playingTitles(rows)).toEqual([])
  })

  it('highlights the playing track, not the row in its position', () => {
    // 4 is Flute Meditation, the second visible row.
    expect(playingTitles(render('wind', 4))).toEqual(['Flute Meditation'])
  })

  it('highlights no row beyond the one the index names', () => {
    // 1 is Persian Vibes. Reading it as a position in the filtered list would
    // highlight Flute Meditation instead.
    expect(playingTitles(render('wind', 1))).toEqual(['Persian Vibes'])
  })

  it('highlights the same track with and without a filter', () => {
    expect(playingTitles(render(null, 4))).toEqual(['Flute Meditation'])
    expect(playingTitles(render('wind', 4))).toEqual(['Flute Meditation'])
  })
})

describe('Playlist rows — the play button and the credit link', () => {
  const mount = (onTrackClick = vi.fn()) => {
    const { container } = renderInDom(
      <Playlist
        currentTrackIndex={0}
        filters={filters}
        selectedFilter="wind"
        title="Meditation Music"
        tracks={tracks}
        onTrackClick={onTrackClick}
      />,
    )

    return { container, onTrackClick }
  }

  it('renders the credit link beside the play button, not inside it', async () => {
    const { container } = mount()
    const row = screen.getByRole('button', { name: 'Flute Meditation' })
    const credit = screen.getByRole('link', { name: /Anna Schmidt/ })

    expect(row.contains(credit)).toBe(false)
    expect(row.parentElement?.contains(credit)).toBe(true)

    const result = await axe.run(container, {
      runOnly: { type: 'rule', values: ['nested-interactive'] },
    })

    expect(result.violations.map((violation) => violation.id)).toEqual([])
  })

  it('draws the focus ring on the play button', () => {
    mount()

    expect(screen.getByRole('button', { name: 'Flute Meditation' }).className.split(' ')).toContain(
      'focus-ring',
    )
  })

  it('plays the track the row names, by its index in the full list', () => {
    const { onTrackClick } = mount()

    fireEvent.click(screen.getByRole('button', { name: 'Flute Meditation' }))

    expect(onTrackClick).toHaveBeenCalledExactlyOnceWith(4)
  })

  it('opens the credit without playing the track', () => {
    const { onTrackClick } = mount()

    fireEvent.click(screen.getByRole('link', { name: /Anna Schmidt/ }))

    expect(onTrackClick).not.toHaveBeenCalled()
  })
})

describe('Playlist durations', () => {
  it('prints the duration a track states', () => {
    expect(markup(null, 0)).toContain('3:16')
  })

  it('prints no duration where a song states none', () => {
    // `contentIndexTrack` hands over `0` where SahajCloud stores no duration.
    const undated = tracks.map((track) => ({ ...track, duration: 0 }))

    expect(markup(null, 0, undated)).not.toContain('0:00')
  })

  it('prints a non-finite duration as 0:00', () => {
    // howler reports `Infinity` for a source of indeterminate length.
    const endless = [{ ...tracks[0], duration: Infinity }]

    expect(markup(null, 0, endless)).toContain('0:00')
  })
})
