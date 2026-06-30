import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Image, buildLightboxSlide } from './Image'
import { LightboxProvider } from '../../molecules/Lightbox/LightboxProvider'

const CF_URL = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123/'
const PICSUM_URL = 'https://picsum.photos/seed/foo/400/400'

describe('<Image> Cloudflare Images integration', () => {
  it('transforms src to the matching variant for Cloudflare URLs', () => {
    const html = renderToStaticMarkup(<Image alt="test" aspectRatio="video" src={CF_URL} />)

    expect(html).toContain(`src="${CF_URL}video-800"`)
  })

  it('emits a responsive srcSet covering all widths for the aspect ratio', () => {
    const html = renderToStaticMarkup(<Image alt="test" aspectRatio="video" src={CF_URL} />)

    expect(html).toContain('video-640 640w')
    expect(html).toContain('video-800 800w')
    expect(html).toContain('video-1024 1024w')
    expect(html).toContain('video-1536 1536w')
  })

  it('leaves src unchanged and omits srcSet for non-Cloudflare URLs', () => {
    const html = renderToStaticMarkup(<Image alt="test" aspectRatio="video" src={PICSUM_URL} />)

    expect(html).toContain(`src="${PICSUM_URL}"`)
    expect(html).not.toContain('srcset=')
  })

  it('respects responsive={false}: transforms src but suppresses srcSet', () => {
    const html = renderToStaticMarkup(
      <Image alt="test" aspectRatio="video" responsive={false} src={CF_URL} />,
    )

    expect(html).toContain(`src="${CF_URL}video-800"`)
    expect(html).not.toContain('srcset=')
  })

  it('leaves src unchanged when aspectRatio is omitted', () => {
    const html = renderToStaticMarkup(<Image alt="test" src={CF_URL} />)

    expect(html).toContain(`src="${CF_URL}"`)
    expect(html).not.toContain('srcset=')
  })
})

describe('<Image> forceAspectRatio', () => {
  it('constrains to a fixed-ratio box by default (aspect class on container, img fills it)', () => {
    const html = renderToStaticMarkup(<Image alt="test" aspectRatio="video" src={CF_URL} />)

    expect(html).toContain('aspect-video')
    expect(html).toContain('w-full h-full') // <img> fills the box
  })

  it('renders natural flow when false, but still fetches the optimized variant + srcset', () => {
    const html = renderToStaticMarkup(
      <Image alt="test" aspectRatio="video" forceAspectRatio={false} src={CF_URL} />,
    )

    // The optimized variant + responsive srcSet are still emitted...
    expect(html).toContain(`src="${CF_URL}video-800"`)
    expect(html).toContain('video-1536 1536w')
    // ...but no fixed-ratio box, and the <img> is not absolutely positioned to fill one.
    expect(html).not.toContain('aspect-video')
    expect(html).not.toContain('w-full h-full')
  })
})

describe('buildLightboxSlide', () => {
  it('requests the largest Cloudflare variant and mirrors alt into the caption', () => {
    const slide = buildLightboxSlide(CF_URL, 'A sunrise', 'video')

    // video's largest configured variant is 1536.
    expect(slide.src).toBe(`${CF_URL}video-1536`)
    expect(slide.alt).toBe('A sunrise')
    expect(slide.description).toBe('A sunrise')
  })

  it('leaves non-Cloudflare URLs unchanged', () => {
    const slide = buildLightboxSlide(PICSUM_URL, 'A picture', 'video')

    expect(slide.src).toBe(PICSUM_URL)
  })

  it('leaves the URL unchanged when no aspectRatio is given', () => {
    const slide = buildLightboxSlide(CF_URL, 'No ratio')

    expect(slide.src).toBe(CF_URL)
  })

  it('omits the caption when alt is empty', () => {
    expect(buildLightboxSlide(CF_URL, '', 'video').description).toBeUndefined()
  })
})

describe('<Image> lightbox trigger', () => {
  it('renders a keyboard-accessible trigger when lightboxGroup is set inside a provider', () => {
    const html = renderToStaticMarkup(
      <LightboxProvider>
        <Image alt="A sunrise" aspectRatio="video" lightboxGroup="g1" src={CF_URL} />
      </LightboxProvider>,
    )

    expect(html).toContain('<button')
    expect(html).toContain('type="button"')
    expect(html).toContain('aria-haspopup="dialog"')
    expect(html).toContain('aria-label="View image: A sunrise"')
    // the optimized <img> still renders inside the trigger
    expect(html).toContain(`src="${CF_URL}video-800"`)
  })

  it('falls back to a generic label when alt is empty', () => {
    const html = renderToStaticMarkup(
      <LightboxProvider>
        <Image alt="" aspectRatio="video" lightboxGroup="g1" src={CF_URL} />
      </LightboxProvider>,
    )

    expect(html).toContain('aria-label="View image"')
  })

  it('renders no trigger when lightboxGroup is set but no provider is mounted', () => {
    const html = renderToStaticMarkup(
      <Image alt="A sunrise" aspectRatio="video" lightboxGroup="g1" src={CF_URL} />,
    )

    expect(html).not.toContain('<button')
    expect(html).toContain(`src="${CF_URL}video-800"`)
  })

  it('renders no trigger without a lightboxGroup, even inside a provider', () => {
    const html = renderToStaticMarkup(
      <LightboxProvider>
        <Image alt="x" aspectRatio="video" src={CF_URL} />
      </LightboxProvider>,
    )

    expect(html).not.toContain('<button')
  })
})
