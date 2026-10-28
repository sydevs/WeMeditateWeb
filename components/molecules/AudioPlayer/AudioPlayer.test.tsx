import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { AudioPlayer } from './AudioPlayer'
import type { Track } from './types'
import { CF_PUBLIC_URL } from '../../../tests/_helpers/cloudflare-images'

const track: Track = {
  url: 'https://example.com/song.mp3',
  title: 'Raag Durga',
  credit: 'Anon',
  creditURL: 'https://example.com',
  thumbnailURL: CF_PUBLIC_URL,
  duration: 300,
}

describe('<AudioPlayer> now-playing thumbnail sizes', () => {
  it('advertises the 48px box it draws', () => {
    const html = renderToStaticMarkup(<AudioPlayer tracks={[track]} />)

    // Asserted together, so the pixel number cannot outlive the box.
    expect(html).toContain('w-12 h-12')
    expect(html).toContain('sizes="48px"')
    expect(html).not.toContain('/public')
  })
})
