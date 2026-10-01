import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Avatar } from './Avatar'

describe('<Avatar> server render', () => {
  // The same zero-opacity gate that hid every <Image> hid every avatar too
  // (#145). The loading state belongs on the client, where the fade can run.
  it('renders the <img> with no opacity gate', () => {
    const html = renderToStaticMarkup(<Avatar alt="Jane Smith" src="/jane.jpg" />)

    expect(html).toContain('src="/jane.jpg"')
    expect(html).not.toContain('opacity-0')
  })

  it('renders initials and no <img> without a src', () => {
    const html = renderToStaticMarkup(<Avatar alt="Jane Smith" />)

    expect(html).not.toContain('<img')
    expect(html).toContain('JS')
  })

  it('keeps the initials underneath an image for a failed load', () => {
    const html = renderToStaticMarkup(<Avatar alt="Jane Smith" src="/jane.jpg" />)

    expect(html).toContain('JS')
  })
})
