import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MusicLibrary } from './MusicLibrary'
import type { Track } from '../../molecules'
import { CF_PUBLIC_URL } from '../../../tests/_helpers/cloudflare-images'

const track: Track = {
  url: 'https://example.com/song.mp3',
  title: 'Raag Durga',
  credit: 'Anon',
  creditURL: 'https://example.com',
  thumbnailURL: CF_PUBLIC_URL,
  duration: 300,
}

describe('<MusicLibrary> album art sizes', () => {
  it('advertises the max-w-md column it draws, less its own padding', () => {
    const html = renderToStaticMarkup(<MusicLibrary filters={[]} tracks={[track]} />)

    // Asserted together, so the pixel numbers cannot outlive the column. The
    // `md` arm is an expression because the two-column grid makes the column
    // 316px there, where a flat 448 would fetch 800 instead of 400 (#146).
    expect(html).toContain('max-w-md mx-auto md:mx-0 p-4')
    expect(html).toContain(
      'sizes="(min-width: 968px) 416px, (min-width: 768px) calc(50vw - 68px), (min-width: 448px) 416px, calc(100vw - 64px)"',
    )
    expect(html).not.toContain('/public')
  })
})
