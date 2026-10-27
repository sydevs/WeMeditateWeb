import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { AudioPlayer } from './AudioPlayer'
import type { Track } from './types'

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

describe('<AudioPlayer> now-playing thumbnail sizes', () => {
  // The box is `w-12 h-12`, 48px. Without an explicit `sizes` the atom
  // assumed a full-width layout and fetched 800px into it (#146).
  it('advertises the 48px box', () => {
    const html = renderToStaticMarkup(<AudioPlayer tracks={[track]} />)

    expect(html).toContain('sizes="48px"')
    expect(html).not.toContain('/public')
  })
})
