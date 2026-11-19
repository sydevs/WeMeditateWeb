import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { SplashLoader } from './SplashLoader'
import { classFor, classOf, openTag } from '../../../tests/_helpers/markup'

const CF_PUBLIC_URL = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123/public'

describe('<SplashLoader> background image', () => {
  it('resolves a SahajCloud URL to the variant, replacing /public', () => {
    const html = renderToStaticMarkup(<SplashLoader backgroundImage={CF_PUBLIC_URL} />)

    expect(html).toContain('https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123/width=2048')
    expect(html).not.toContain('/public')
  })

  it('leaves a non-Cloudflare URL unchanged', () => {
    const html = renderToStaticMarkup(<SplashLoader backgroundImage="/splash-bg.jpg" />)

    expect(html).toContain('/splash-bg.jpg')
  })

  it('paints it as a decorative <img> on screen at once, never a CSS background', () => {
    const html = renderToStaticMarkup(<SplashLoader backgroundImage="/splash-bg.jpg" />)
    const img = openTag(html, 'img')

    expect(img).toContain('src="/splash-bg.jpg"')
    expect(img).toContain('alt=""')
    expect(img).toContain('loading="eager"')
    expect(html).not.toContain('background-image')
  })

  it('isolates its blend, so the tint multiplies its own image and nothing behind it', () => {
    const html = renderToStaticMarkup(<SplashLoader backgroundImage="/splash-bg.jpg" />)

    expect(classOf(html, '<div').split(' ')).toContain('isolate')
  })
})

describe('<SplashLoader> surface', () => {
  it('draws the logo on a dark surface over a dark tint', () => {
    const html = renderToStaticMarkup(<SplashLoader color="secondary" />)

    expect(classOf(html, '<div').split(' ')).toContain('surface-dark')
    expect(classFor(html, 'mix-blend-multiply').split(' ')).toContain('bg-coral-900')
  })

  it('draws it on a light surface over the warm wash', () => {
    const html = renderToStaticMarkup(<SplashLoader color="warm" />)

    expect(classOf(html, '<div').split(' ')).toContain('surface-light')
    expect(classFor(html, 'mix-blend-multiply').split(' ')).toContain('bg-bg-warm')
  })
})

describe('<SplashLoader autoExit>', () => {
  it('ends itself in CSS, for a server-rendered loader JavaScript may never reach', () => {
    const html = renderToStaticMarkup(<SplashLoader autoExit />)

    expect(classOf(html, '<div').split(' ')).toContain('animate-splash-loader-exit')
  })

  it('leaves a loader without it to `isLoading` alone', () => {
    const html = renderToStaticMarkup(<SplashLoader />)

    expect(classOf(html, '<div').split(' ')).toContain('opacity-100')
    expect(classOf(html, '<div').split(' ')).not.toContain('animate-splash-loader-exit')
  })
})
