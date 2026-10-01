import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Splash } from './Splash'

const CF_PUBLIC_URL = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123/public'

describe('<Splash> background image', () => {
  it('resolves a SahajCloud URL to the variant, replacing /public', () => {
    const html = renderToStaticMarkup(<Splash backgroundImage={CF_PUBLIC_URL} title="Welcome" />)

    expect(html).toContain('https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123/ultrawide-2048')
    expect(html).not.toContain('/public')
  })

  it('leaves a non-Cloudflare URL unchanged', () => {
    const html = renderToStaticMarkup(<Splash backgroundImage="/splash-bg.jpg" title="Welcome" />)

    expect(html).toContain('/splash-bg.jpg')
  })
})
