import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Image } from './Image'

const CF_URL = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123/'
const PICSUM_URL = 'https://picsum.photos/seed/foo/400/400'

describe('<Image> Cloudflare Images integration', () => {
  it('transforms src to the matching variant for Cloudflare URLs', () => {
    const html = renderToStaticMarkup(
      <Image src={CF_URL} alt="test" aspectRatio="video" />,
    )
    expect(html).toContain(`src="${CF_URL}video-800"`)
  })

  it('emits a responsive srcSet covering all widths for the aspect ratio', () => {
    const html = renderToStaticMarkup(
      <Image src={CF_URL} alt="test" aspectRatio="video" />,
    )
    expect(html).toContain('video-640 640w')
    expect(html).toContain('video-800 800w')
    expect(html).toContain('video-1024 1024w')
    expect(html).toContain('video-1536 1536w')
  })

  it('leaves src unchanged and omits srcSet for non-Cloudflare URLs', () => {
    const html = renderToStaticMarkup(
      <Image src={PICSUM_URL} alt="test" aspectRatio="video" />,
    )
    expect(html).toContain(`src="${PICSUM_URL}"`)
    expect(html).not.toContain('srcset=')
  })

  it('respects responsive={false}: transforms src but suppresses srcSet', () => {
    const html = renderToStaticMarkup(
      <Image
        src={CF_URL}
        alt="test"
        aspectRatio="video"
        responsive={false}
      />,
    )
    expect(html).toContain(`src="${CF_URL}video-800"`)
    expect(html).not.toContain('srcset=')
  })

  it('leaves src unchanged when aspectRatio is omitted', () => {
    const html = renderToStaticMarkup(<Image src={CF_URL} alt="test" />)
    expect(html).toContain(`src="${CF_URL}"`)
    expect(html).not.toContain('srcset=')
  })
})
