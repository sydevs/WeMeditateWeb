import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { HeaderDropdown } from './HeaderDropdown'

// The shape a SahajCloud read sends: `…/<image_id>/public`
// (sydevs/SahajCloud `src/plugins/storage/cloudflareImagesAdapter.ts:203`).
const CF_PUBLIC_URL = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123/public'

describe('<HeaderDropdown> thumbnail sizes', () => {
  // Without an explicit `sizes` the atom assumed a full-width layout and
  // fetched 800px into a grid column at most 480px wide (#146).
  it('advertises the grid column width, narrowing at the three-column step', () => {
    const html = renderToStaticMarkup(
      <HeaderDropdown
        featuredArticles={[{ title: 'Alpha', image: CF_PUBLIC_URL, imageAlt: 'Alpha', href: '#1' }]}
        links={[{ label: 'Start', href: '/start' }]}
        title="Meditation"
      />,
    )

    expect(html).toContain('sizes="(min-width: 1024px) 400px, 480px"')
    expect(html).not.toContain('/public')
  })
})
