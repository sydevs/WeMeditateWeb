import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { SocialShare } from './SocialShare'

const SHARE_LINK = {
  whatsapp: 'https://wa.me/',
  facebook: 'https://www.facebook.com/sharer/',
  pinterest: 'https://pinterest.com/pin/',
} as const

describe('SocialShare platforms', () => {
  it("renders the caller's platforms in the caller's order, leaving the array alone", () => {
    // Frozen, so a sort in place throws instead of passing silently.
    const platforms = Object.freeze(['whatsapp', 'facebook', 'pinterest'] as const)
    const html = renderToStaticMarkup(
      <SocialShare platforms={platforms} url="https://wemeditate.com/about-meditation" />,
    )
    const at = platforms.map((platform) => html.indexOf(`href="${SHARE_LINK[platform]}`))

    expect(at.every((index) => index > -1)).toBe(true)
    expect([...at].sort((a, b) => a - b)).toEqual(at)
  })
})
