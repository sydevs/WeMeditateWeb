import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MusicLibrary } from './MusicLibrary'
import type { Track } from '../../molecules'

// The shape a SahajCloud read sends: `…/<image_id>/public`
// (sydevs/SahajCloud `src/plugins/storage/cloudflareImagesAdapter.ts:203`).
const CF_PUBLIC_URL = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123/public'

const track: Track = {
  url: 'https://example.com/song.mp3',
  title: 'Raag Durga',
  credit: 'Anon',
  creditURL: 'https://example.com',
  thumbnailURL: CF_PUBLIC_URL,
  duration: 300,
}

describe('<MusicLibrary> album art sizes', () => {
  // The art column is `max-w-md`, 448px. Without an explicit `sizes` the atom
  // assumed a full-width layout and fetched for 800px (#146).
  it('advertises the max-w-md column, falling back to the viewport below it', () => {
    const html = renderToStaticMarkup(<MusicLibrary filters={[]} tracks={[track]} />)

    expect(html).toContain('sizes="(min-width: 448px) 448px, 100vw"')
    expect(html).not.toContain('/public')
  })
})
