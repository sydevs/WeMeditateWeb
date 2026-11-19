import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { LayoutBlock } from './LayoutBlock'
import type { LayoutItem } from '../../../../lib/content-blocks'
import { anchorFor } from '../../../../tests/_helpers/markup'

const IMAGE = {
  id: 1,
  url: 'https://imagedelivery.net/acct/layout-image/public',
  alt: 'A garden path',
  width: 1600,
  height: 900,
} as unknown as LayoutItem['image']

/** Each `<li …>` opening tag, in document order. */
const itemTags = (html: string) => html.match(/<li[^>]*>/g) ?? []

/** Each carousel dot's number, where the dot is pressed. */
const pressedDots = (html: string) =>
  [...html.matchAll(/aria-label="Go to column (\d+)[^"]*" aria-pressed="true"/g)].map(
    ([, number]) => number,
  )

describe('LayoutBlock grid', () => {
  // The /shri-mataji timeline: the old site showed three of eleven, then a
  // button for the rest.
  const timeline: LayoutItem[] = Array.from({ length: 11 }, (_, index) => ({
    id: `m${index}`,
    title: `Moment ${index + 1}`,
    text: `What happened ${index + 1}.`,
  }))

  it('shows the first three items and a way to the rest', () => {
    const html = renderToStaticMarkup(<LayoutBlock items={timeline} style="grid" />)
    const tags = itemTags(html)

    expect(tags).toHaveLength(11)
    expect(tags.filter((tag) => tag.includes('hidden'))).toHaveLength(8)
    expect(html).toContain('Show More')
  })

  it('nests item titles under the section heading, or starts at h2 without one', () => {
    const titled = renderToStaticMarkup(
      <LayoutBlock items={timeline.slice(0, 2)} style="grid" title="Notable moments" />,
    )
    const bare = renderToStaticMarkup(<LayoutBlock items={timeline.slice(0, 2)} style="grid" />)

    expect(titled).toContain('>Notable moments</h2>')
    expect(titled).toContain('>Moment 1</h3>')
    expect(bare).toContain('>Moment 1</h2>')
    expect(bare).not.toContain('<h3')
  })
})

describe('LayoutBlock title links', () => {
  // The live `list` block on /try-our-guided-course-to-explore-deeper-concepts
  // stores bare slugs, which drew link-styled <a> elements with no href.
  it.each(['list', 'grid'] as const)('reads a bare slug as a site path (%s)', (style) => {
    const html = renderToStaticMarkup(
      <LayoutBlock
        items={[
          { id: 'a', title: 'Techniques', titleUrl: 'techniques', text: 'How to meditate.' },
          { id: 'b', title: 'Live', titleUrl: '/live', text: 'Join online.' },
        ]}
        style={style}
      />,
    )

    expect(anchorFor(html, '/techniques')).not.toBe('')
    expect(anchorFor(html, '/live')).not.toBe('')
    expect(html).not.toMatch(/<a (?![^>]*href=)[^>]*>/)
  })
})

describe('LayoutBlock accordion', () => {
  // SahajCloud offers an image and a title link on every non-tab style; the
  // accordion dropped both.
  it("keeps an item's image and title link, inside its panel", () => {
    const html = renderToStaticMarkup(
      <LayoutBlock
        items={[
          {
            id: 'join',
            title: 'How to join?',
            titleUrl: 'live',
            image: IMAGE,
            text: 'Pick a session.',
          },
        ]}
        style="accordion"
      />,
    )
    const panel = html.slice(html.indexOf('id="accordion-content-join"'))

    expect(panel).toContain('alt="A garden path"')
    expect(panel).toContain('Pick a session.')
    expect(anchorFor(panel, '/live')).not.toBe('')
  })
})

describe('LayoutBlock tabs', () => {
  // /mooladhara-chakra, as SahajCloud stores it: the centre aspect first, and
  // the block opening on it.
  const mooladhara: LayoutItem[] = [
    { id: 'c', title: 'Center aspect', titleUrl: '#center-aspect', text: 'Innocence.' },
    { id: 'l', title: 'Left Aspect', titleUrl: '#left-aspect', text: 'Chastity.' },
    { id: 'r', title: 'Right Aspect', titleUrl: '#right-aspect', text: 'Dynamism.' },
  ]

  it('opens on the default tab', () => {
    const html = renderToStaticMarkup(
      <LayoutBlock defaultTab="#center-aspect" items={mooladhara} style="tabs" />,
    )

    expect(pressedDots(html)).toEqual(['1'])
  })

  it('opens on the middle tab when the default names none of them', () => {
    const html = renderToStaticMarkup(
      <LayoutBlock defaultTab="#missing" items={mooladhara} style="tabs" />,
    )

    expect(pressedDots(html)).toEqual(['2'])
  })

  // The anchor is the tab's own: as a link it pointed each title at an id no
  // element on the page carries.
  it('does not link a title to its own anchor', () => {
    const html = renderToStaticMarkup(<LayoutBlock items={mooladhara} style="tabs" />)

    expect(html).toContain('Left Aspect')
    expect(html).not.toContain('href="#')
  })

  it('keeps every tab, past five', () => {
    const many: LayoutItem[] = Array.from({ length: 7 }, (_, index) => ({
      id: `t${index}`,
      title: `Tab ${index + 1}`,
      titleUrl: `#tab-${index + 1}`,
      text: `Body ${index + 1}.`,
    }))
    const html = renderToStaticMarkup(<LayoutBlock items={many} style="tabs" />)

    expect(html).toContain('Tab 7')
    expect(html).toContain('Body 7.')
  })
})
