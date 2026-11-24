import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ResolvedMood } from '@/lib/content/blocks'
import { anchorFor, classFor, classOf } from '@/tests/_helpers/markup'
import { MoodPicker, moodsForSlot } from './MoodPicker'

const mood = (overrides: Partial<ResolvedMood> = {}): ResolvedMood => ({
  id: '1',
  title: 'Calm',
  color: '#7bbf8e',
  iconUrl: 'https://assets.test/calm.svg',
  slots: { morning: '/meditations/11' },
  ...overrides,
})

/** One featured mood per slot, which is the shape upstream actually holds. */
const MOODS = [
  mood({ id: '1', title: 'Calm', slots: { morning: '/meditations/11' } }),
  mood({ id: '2', title: 'Grateful', slots: { afternoon: '/meditations/12' } }),
  mood({ id: '3', title: 'Restless', slots: { evening: '/meditations/13' } }),
]

describe('moodsForSlot', () => {
  it('keeps only the moods with a meditation in the slot', () => {
    expect(moodsForSlot(MOODS, 'afternoon')).toEqual([{ mood: MOODS[1], href: '/meditations/12' }])
  })

  it('keeps the block order', () => {
    const everywhere = MOODS.map((each) => mood({ ...each, slots: { evening: '/x' } }))

    expect(moodsForSlot(everywhere, 'evening').map(({ mood: m }) => m.title)).toEqual([
      'Calm',
      'Grateful',
      'Restless',
    ])
  })

  it('offers every mood at its earliest filled slot when there is no slot to narrow by', () => {
    expect(moodsForSlot(MOODS, null).map(({ href }) => href)).toEqual([
      '/meditations/11',
      '/meditations/12',
      '/meditations/13',
    ])
  })

  it('picks the earliest slot in day order for a mood filled in several', () => {
    const everySlot = mood({
      slots: { evening: '/meditations/13', morning: '/meditations/11' },
    })

    expect(moodsForSlot([everySlot], null)[0].href).toBe('/meditations/11')
  })
})

describe('MoodPicker', () => {
  it('renders one tile per mood in the server slot, linked to its meditation', () => {
    const html = renderToStaticMarkup(<MoodPicker moods={MOODS} serverSlot="evening" />)

    expect(html).toContain('Restless')
    expect(html).not.toContain('Calm')
    expect(html).not.toContain('Grateful')
    expect(anchorFor(html, '/meditations/13')).toContain('<a')
  })

  it('shows every mood when the server had no zone to read', () => {
    const html = renderToStaticMarkup(<MoodPicker moods={MOODS} serverSlot={null} />)

    for (const title of ['Calm', 'Grateful', 'Restless']) {
      expect(html).toContain(title)
    }
  })

  it('renders nothing at all when no mood fits the slot', () => {
    expect(renderToStaticMarkup(<MoodPicker moods={MOODS} serverSlot="morning" />)).toContain(
      'Calm',
    )
    // Only morning is filled on this one, so an evening visitor gets no picker.
    expect(renderToStaticMarkup(<MoodPicker moods={[mood()]} serverSlot="evening" />)).toBe('')
  })

  it('renders nothing for an empty mood list', () => {
    expect(renderToStaticMarkup(<MoodPicker moods={[]} serverSlot="morning" />)).toBe('')
  })

  it('locale-prefixes each tile through the Link atom', () => {
    const html = renderToStaticMarkup(<MoodPicker moods={[mood()]} serverSlot="morning" />)

    // The default locale adds no prefix; `ContentIndex.locale.test.tsx` is
    // where a non-English `pageContext` is proven to reach the atom.
    expect(anchorFor(html, '/meditations/11')).toContain('href="/meditations/11"')
  })

  it('draws the icon as a mask filled with the mood colour', () => {
    const html = renderToStaticMarkup(<MoodPicker moods={[mood()]} serverSlot="morning" />)

    expect(html).toContain('--mood-color:#7bbf8e')
    expect(html).toContain('mask-image:url(&quot;https://assets.test/calm.svg&quot;)')
    // A plain <img> would render the currentColor SVG black.
    expect(html).not.toContain('<img')
  })

  it('falls back to the site teal for a colour the resolver refused', () => {
    const html = renderToStaticMarkup(
      <MoodPicker moods={[mood({ color: null })]} serverSlot="morning" />,
    )

    expect(html).toContain('--mood-color:var(--color-teal-600)')
  })

  it('omits the icon, and keeps the tile, for a mood with no icon', () => {
    const html = renderToStaticMarkup(
      <MoodPicker moods={[mood({ iconUrl: null })]} serverSlot="morning" />,
    )

    expect(html).toContain('Calm')
    expect(html).not.toContain('mask-image')
  })

  it('fills the circle and whitens the icon on hover and focus', () => {
    const html = renderToStaticMarkup(<MoodPicker moods={[mood()]} serverSlot="morning" />)
    const circle = classFor(html, 'rounded-full').split(' ')

    expect(circle).toContain('group-hover:bg-[var(--mood-color)]')
    expect(circle).toContain('group-focus-visible:bg-[var(--mood-color)]')
    expect(circle).toContain('transition-colors')

    const icon = classFor(html, 'size-8').split(' ')

    expect(icon).toContain('group-hover:bg-white')
    expect(icon).toContain('group-focus-visible:bg-white')
  })

  it('lays the tiles out two to a row, three from sm, in a list', () => {
    const html = renderToStaticMarkup(<MoodPicker moods={MOODS} serverSlot={null} />)
    const grid = classOf(html, '<ul').split(' ')

    expect(grid).toContain('grid-cols-2')
    expect(grid).toContain('sm:grid-cols-3')
    expect(html).toContain('<li')
  })

  it('gives each tile a focus ring and a label the surface colours', () => {
    const html = renderToStaticMarkup(<MoodPicker moods={[mood()]} serverSlot="morning" />)

    const tile = classFor(html, 'focus-ring').split(' ')

    expect(tile).toContain('focus-ring')
    // The anchor is the group, so the circle's hover and focus states key off
    // the one element a pointer and a keyboard both reach.
    expect(tile).toContain('group')
    // An editor's colour never backs text.
    expect(classFor(html, 'text-fg').split(' ')).toContain('text-fg')
  })
})
