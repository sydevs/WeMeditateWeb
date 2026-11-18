import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Playlist } from './Playlist'
import type { Track } from '../AudioPlayer/types'

function track(duration: number): Track {
  return {
    url: 'https://example.com/song.mp3',
    title: 'Sahaja',
    credit: 'Anon',
    creditURL: 'https://example.com',
    thumbnailURL: '',
    duration,
  }
}

describe('Playlist duration display', () => {
  it('renders a finite duration as M:SS', () => {
    const html = renderToStaticMarkup(
      <Playlist
        title="Music"
        tracks={[track(185)]}
        currentTrackIndex={0}
        onTrackClick={() => {}}
      />,
    )

    expect(html).toContain('3:05')
  })

  it('renders a non-finite duration as 0:00', () => {
    const html = renderToStaticMarkup(
      <Playlist
        title="Music"
        tracks={[track(Infinity)]}
        currentTrackIndex={0}
        onTrackClick={() => {}}
      />,
    )

    expect(html).toContain('0:00')
  })
})
