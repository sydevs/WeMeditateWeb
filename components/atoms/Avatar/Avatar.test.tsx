import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Avatar } from './Avatar'

// The shape a SahajCloud read sends: `…/<image_id>/public`
// (sydevs/SahajCloud `src/plugins/storage/cloudflareImagesAdapter.ts:203`).
const CF_PUBLIC_URL = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123/public'

describe('<Avatar> server render', () => {
  // The same zero-opacity gate that hid every <Image> hid every avatar too
  // (#145). The loading state belongs on the client, where the fade can run.
  it('renders the <img> lazily and with no opacity gate', () => {
    const html = renderToStaticMarkup(<Avatar alt="Jane Smith" src="/jane.jpg" />)

    expect(html).toContain('src="/jane.jpg"')
    expect(html).not.toContain('opacity-0')
    // The initials stay underneath as the placeholder.
    expect(html).toContain('JS')
    // An avatar is never the hero, so it must not win a hoisted preload.
    expect(html).toContain('loading="lazy"')
    expect(html).not.toContain('rel="preload"')
  })

  it('renders initials and no <img> without a src', () => {
    const html = renderToStaticMarkup(<Avatar alt="Jane Smith" />)

    expect(html).not.toContain('<img')
    expect(html).toContain('JS')
  })
})

describe('<Avatar> image variant', () => {
  // A 40px box was fed the full-resolution original, because Avatar never
  // asked Cloudflare for a variant (#146).
  it('requests the 200px square width for a SahajCloud photo', () => {
    const html = renderToStaticMarkup(<Avatar alt="Jane Smith" src={CF_PUBLIC_URL} />)

    expect(html).toContain(
      'src="https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123/width=200"',
    )
    expect(html).not.toContain('/public')
  })

  it.each([
    ['a bundled asset', '/assets/smnd.webp'],
    ['a story placeholder', 'https://picsum.photos/seed/jane/200/200'],
    ['the SahajCloud dev fallback', '/api/media/file/jane.jpg'],
  ])('leaves %s unchanged', (_label, src) => {
    expect(renderToStaticMarkup(<Avatar alt="Jane Smith" src={src} />)).toContain(`src="${src}"`)
  })
})
