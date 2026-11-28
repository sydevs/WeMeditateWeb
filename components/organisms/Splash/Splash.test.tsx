import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Splash } from './Splash'
import { anchorFor, classFor, classesWith, openTag } from '@/tests/_helpers/markup'

const CF_PUBLIC_URL = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123/public'

describe('<Splash> background image', () => {
  it('resolves a SahajCloud URL to the variant, replacing /public', () => {
    const html = renderToStaticMarkup(<Splash backgroundImage={CF_PUBLIC_URL} title="Welcome" />)

    expect(html).toContain('https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123/width=2048')
    expect(html).not.toContain('/public')
  })

  it('leaves a non-Cloudflare URL unchanged', () => {
    const html = renderToStaticMarkup(<Splash backgroundImage="/splash-bg.jpg" title="Welcome" />)

    expect(html).toContain('/splash-bg.jpg')
  })
})

describe('<Splash> call to action', () => {
  const splash = (ctaHref: string) =>
    renderToStaticMarkup(
      <Splash backgroundImage="/splash-bg.jpg" ctaHref={ctaHref} ctaText="Begin" title="Welcome" />,
    )

  it('renders nothing at all for a refused URL, not inert words', () => {
    const html = splash('javascript:alert(1)')

    expect(html).not.toContain('Begin')
    expect(html).not.toContain('javascript:')
  })

  it('carries the visitor’s locale onto a site path, as every other link does', () => {
    expect(splash('/meditations')).toContain('href="/meditations"')
  })

  it('keeps its transform hover, which the atom no longer overrides', () => {
    const html = splash('/meditations')

    expect(html).toContain('transition-transform')
    expect(html).not.toContain('transition-colors')
  })
})

describe('<Splash loader> in the server’s HTML', () => {
  const lead = (surface: 'light' | 'dark' = 'dark') =>
    renderToStaticMarkup(
      <Splash
        loader
        priority
        backgroundImage={CF_PUBLIC_URL}
        ctaHref="/meditations"
        ctaText="Begin"
        surface={surface}
        title="Welcome"
      />,
    )

  it('ends on a CSS timer, so a visitor without JavaScript is not left under it', () => {
    const overlay = classFor(lead(), 'animate-splash-loader-exit').split(' ')

    expect(overlay).toContain('absolute')
    expect(overlay).toContain('motion-reduce:hidden')
    expect(overlay).toContain('pointer-events-none')
    // `visibility`, not `display`: an element shown again from `display: none`
    // restarts its animation, so leaving the splash would re-arm the timer.
    expect(overlay).toContain('group-focus-within/splash:invisible')
    expect(overlay).not.toContain('group-focus-within/splash:hidden')
  })

  it('carries the script that ends it when the hero settles, before hydration', () => {
    const html = lead()

    // The parser runs it where it stands, so it must follow both elements it
    // reads. The jsdom spec runs it.
    expect(openTag(html, 'script')).toBe('<script>')
    expect(html.indexOf('<script>')).toBeGreaterThan(html.indexOf('animate-splash-loader-exit'))
  })

  it('covers the content from above it, and the content stays in the markup', () => {
    const html = lead()

    expect(classFor(html, 'animate-splash-loader-exit').split(' ')).toContain('z-20')
    expect(html.indexOf('Welcome')).toBeGreaterThan(-1)
    expect(html.indexOf('Welcome')).toBeLessThan(html.indexOf('animate-splash-loader-exit'))
    expect(anchorFor(html, '/meditations')).not.toBe('')
  })

  it('repeats the hero’s own URL as an <img>, so the page still preloads one image', () => {
    const html = lead()
    const variant = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123/width=2048'

    // The hero, the loader's copy, and the one hoisted preload's href.
    expect(html.split(variant)).toHaveLength(4)
    expect(html.split('rel="preload"')).toHaveLength(2)
    expect(html).not.toContain('background-image')
  })

  it('tints a dark splash with the brand’s dark coral, and a light one with the warm wash', () => {
    expect(classFor(lead('dark'), 'mix-blend-multiply').split(' ')).toContain('bg-coral-900')
    expect(classFor(lead('light'), 'mix-blend-multiply').split(' ')).toContain('bg-bg-warm')
    expect(classFor(lead('light'), 'animate-splash-loader-exit').split(' ')).toContain(
      'surface-light',
    )
  })

  it('is absent without the prop', () => {
    const html = renderToStaticMarkup(<Splash priority backgroundImage={CF_PUBLIC_URL} />)

    expect(html).toContain('fetchPriority="high"')
    expect(classesWith(html, 'mix-blend-multiply')).toEqual([])
    expect(openTag(html, 'script')).toBe('')
    expect(openTag(html, 'img')).not.toContain(' id=')
  })
})
