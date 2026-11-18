import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Splash } from './Splash'

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
