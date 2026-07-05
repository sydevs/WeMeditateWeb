import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { RelatedContent } from './RelatedContent'
import type { ResolvedCardItem } from '../../../lib/cms-blocks'

const item = (id: number, title: string): ResolvedCardItem => ({
  id,
  title,
  href: `/meditations/${id}`,
  thumbnailSrc: `https://picsum.photos/seed/${id}/800/450`,
  aspectRatio: 'video',
  playButton: true,
  durationMinutes: 12,
})

describe('RelatedContent', () => {
  it('renders a titled carousel with a card per item when items are present', () => {
    const html = renderToStaticMarkup(
      <RelatedContent items={[item(1, 'Alpha'), item(2, 'Beta')]} title="Related meditations" />,
    )

    expect(html).toContain('Related meditations')
    expect(html).toContain('Alpha')
    expect(html).toContain('Beta')
    expect(html).toContain('/meditations/1')
    expect(html).toContain('/meditations/2')
    // Rendered via ContentCarousel (its nav controls are present).
    expect(html).toContain('aria-label="Previous slide"')
    expect(html).toContain('aria-label="Next slide"')
  })

  it('renders nothing when there are no items (empty section omitted, not a bare heading)', () => {
    const html = renderToStaticMarkup(<RelatedContent items={[]} title="Related meditations" />)

    expect(html).toBe('')
  })
})
