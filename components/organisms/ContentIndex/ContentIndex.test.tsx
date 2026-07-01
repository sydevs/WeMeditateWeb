import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ContentIndex, deriveFacets, filterByFacets } from './ContentIndex'
import type { ResolvedCardItem } from '../../../lib/cms-blocks'

const item = (
  id: number,
  title: string,
  tags?: { id: string; label: string }[],
): ResolvedCardItem => ({
  id,
  title,
  href: `#${id}`,
  thumbnailSrc: `https://picsum.photos/seed/${id}/400/400`,
  tags,
})

const WISDOM = { id: 'wisdom', label: 'Wisdom' }
const LIFESTYLE = { id: 'lifestyle', label: 'Lifestyle' }

const items: ResolvedCardItem[] = [
  item(1, 'Alpha', [WISDOM]),
  item(2, 'Beta', [LIFESTYLE]),
  item(3, 'Gamma', [WISDOM, LIFESTYLE]),
  item(4, 'Delta'), // untagged
]

describe('deriveFacets', () => {
  it('collects unique facets in first-appearance order (first label wins)', () => {
    expect(deriveFacets(items)).toEqual([WISDOM, LIFESTYLE])
  })

  it('dedupes by id even when a later label differs', () => {
    const facets = deriveFacets([
      item(1, 'A', [{ id: 'wisdom', label: 'Wisdom' }]),
      item(2, 'B', [{ id: 'wisdom', label: 'Other' }]),
    ])

    expect(facets).toEqual([{ id: 'wisdom', label: 'Wisdom' }])
  })

  it('returns [] when no item carries tags', () => {
    expect(deriveFacets([item(1, 'A'), item(2, 'B')])).toEqual([])
  })
})

describe('filterByFacets', () => {
  it('returns everything when the selection is empty', () => {
    expect(filterByFacets(items, new Set())).toHaveLength(4)
  })

  it('narrows to items intersecting a single facet', () => {
    const titles = filterByFacets(items, new Set(['wisdom'])).map((i) => i.title)

    expect(titles).toEqual(['Alpha', 'Gamma'])
  })

  it('is OR across multiple selected facets', () => {
    const titles = filterByFacets(items, new Set(['wisdom', 'lifestyle'])).map((i) => i.title)

    expect(titles).toEqual(['Alpha', 'Beta', 'Gamma'])
  })
})

describe('ContentIndex (SSR markup)', () => {
  it('renders an "All" pill plus one pill per facet, with "All" pressed by default', () => {
    const html = renderToStaticMarkup(<ContentIndex items={items} />)

    expect(html).toContain('>All<')
    expect(html).toContain('>Wisdom<')
    expect(html).toContain('>Lifestyle<')
    // First render: "All" is active (aria-pressed="true"), facets are not.
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('aria-pressed="false"')
  })

  it('renders every card on first render (SSR shows the full, SEO-friendly list)', () => {
    const html = renderToStaticMarkup(<ContentIndex items={items} />)

    for (const title of ['Alpha', 'Beta', 'Gamma', 'Delta']) {
      expect(html).toContain(title)
    }
  })

  it('renders no filter pill row when no item carries tags', () => {
    const html = renderToStaticMarkup(<ContentIndex items={[item(1, 'Alpha'), item(2, 'Beta')]} />)

    expect(html).not.toContain('Filter content by tag')
    expect(html).toContain('Alpha')
  })

  it('renders without crashing on an empty list', () => {
    expect(() => renderToStaticMarkup(<ContentIndex items={[]} />)).not.toThrow()
  })
})
