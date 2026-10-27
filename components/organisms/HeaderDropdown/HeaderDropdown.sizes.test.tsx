import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { HeaderDropdown } from './HeaderDropdown'
import { CF_PUBLIC_URL } from '../../../tests/_helpers/cloudflare-images'

describe('<HeaderDropdown> thumbnail sizes', () => {
  it('advertises the grid column it draws, pinned to 400px at the three-column step', () => {
    const html = renderToStaticMarkup(
      <HeaderDropdown
        featuredArticles={[{ title: 'Alpha', image: CF_PUBLIC_URL, imageAlt: 'Alpha', href: '#1' }]}
        links={[{ label: 'Start', href: '/start' }]}
        title="Meditation"
      />,
    )

    // Asserted together, so the pixel numbers cannot outlive the grid. The
    // two-column arm is an expression, not its 480px maximum: a flat 480
    // would fetch 800 across the whole band, where 400 covers it (#146).
    expect(html).toContain('md:grid-cols-2 lg:grid-cols-3')
    expect(html).toContain('sizes="(min-width: 1024px) 400px, calc(50vw - 32px)"')
    expect(html).not.toContain('/public')
  })
})
