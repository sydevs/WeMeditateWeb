import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { SplashLoader } from './SplashLoader'

// What a SahajCloud read actually returns. See lib/cloudflare-images.test.ts.
const CF_PUBLIC_URL = 'https://imagedelivery.net/acct/abc123/public'

describe('<SplashLoader> background image', () => {
  it('resolves a SahajCloud URL to the variant, replacing /public', () => {
    const html = renderToStaticMarkup(<SplashLoader backgroundImage={CF_PUBLIC_URL} />)

    expect(html).toContain('https://imagedelivery.net/acct/abc123/ultrawide-2048')
    expect(html).not.toContain('/public')
  })

  it('leaves a non-Cloudflare URL unchanged', () => {
    const html = renderToStaticMarkup(<SplashLoader backgroundImage="/splash-bg.jpg" />)

    expect(html).toContain('/splash-bg.jpg')
  })
})
