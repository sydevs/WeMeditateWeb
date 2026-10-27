import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Column } from './Column'

// The shape a SahajCloud read sends: `…/<image_id>/public`
// (sydevs/SahajCloud `src/plugins/storage/cloudflareImagesAdapter.ts:203`).
const CF_PUBLIC_URL = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123/public'
const BASE = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123'

describe('<Column> image variant', () => {
  // The image carried width and height but no aspect ratio, so <Image>
  // returned the src untouched and a 160px box got the original (#146).
  it('requests a variant and a srcset for a SahajCloud image', () => {
    const html = renderToStaticMarkup(
      <Column description="Body" imageAlt="Alpha" imageUrl={CF_PUBLIC_URL} title="Alpha" />,
    )

    expect(html).toContain(`srcSet="${BASE}/width=200 200w`)
    expect(html).toContain('sizes="160px"')
    expect(html).not.toContain('/public')
  })

  // `forceAspectRatio={false}`: the square ratio picks the variant without
  // boxing the layout, so the drawn size stays the w-32/md:w-40 classes.
  it('keeps the image in natural flow, not in a forced ratio box', () => {
    const html = renderToStaticMarkup(
      <Column description="Body" imageAlt="Alpha" imageUrl={CF_PUBLIC_URL} title="Alpha" />,
    )

    expect(html).toContain('w-32 h-32 md:w-40 md:h-40')
    expect(html).not.toContain('aspect-square')
    expect(html).not.toContain('absolute inset-0 w-full h-full')
  })

  it.each([
    ['a bundled asset', '/assets/smnd.webp'],
    ['a story placeholder', 'https://picsum.photos/seed/alpha/400/400'],
    ['the SahajCloud dev fallback', '/api/media/file/alpha.jpg'],
  ])('leaves %s unchanged, with no srcset', (_label, src) => {
    const html = renderToStaticMarkup(
      <Column description="Body" imageAlt="Alpha" imageUrl={src} title="Alpha" />,
    )

    expect(html).toContain(`src="${src}"`)
    expect(html).not.toContain('srcSet=')
  })
})
