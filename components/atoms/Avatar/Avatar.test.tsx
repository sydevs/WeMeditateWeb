import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Avatar } from './Avatar'

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
