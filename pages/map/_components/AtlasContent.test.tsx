import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { AtlasContent, atlasHref } from './AtlasContent'
import type { AtlasSeoResponse } from '../../../server/atlas-types'

const breadcrumbs = [
  { name: 'United Kingdom', route: '/gb', url: 'https://wemeditate.com/map/gb' },
  { name: 'London', route: '/gb/london', url: 'https://wemeditate.com/map/gb/london' },
]

function regionSeo(content: Partial<AtlasSeoResponse['content']> = {}): AtlasSeoResponse {
  return {
    type: 'region',
    id: 5,
    route: '/gb/london',
    locale: 'en',
    title: 'London, United Kingdom',
    description: null,
    canonical: 'https://wemeditate.com/map/gb/london',
    alternates: [],
    openGraph: {},
    jsonLd: '{}',
    breadcrumbs,
    content: {
      name: 'London',
      subtitle: 'Greater London',
      level: 'city',
      events: [
        {
          id: 1204,
          route: '/gb/london/1204',
          url: 'https://wemeditate.com/map/gb/london/1204',
          title: 'Saturday morning meditation',
          schedule: 'Every week on Saturday at 9:30 AM',
          address: '12 Beethoven Street, London',
          online: false,
        },
      ],
      eventCount: 1,
      ...content,
    },
  } as AtlasSeoResponse
}

function eventSeo(content: Partial<AtlasSeoResponse['content']> = {}): AtlasSeoResponse {
  return {
    type: 'event',
    id: 1204,
    route: '/gb/london/1204',
    locale: 'en',
    title: 'Saturday morning meditation',
    description: 'Every week on Saturday',
    canonical: 'https://wemeditate.com/map/gb/london/1204',
    alternates: [],
    openGraph: {},
    jsonLd: '{}',
    breadcrumbs,
    content: {
      title: 'Saturday morning meditation',
      languages: ['en'],
      schedule: {
        oneLine: 'Every week on Saturday at 9:30 AM',
        startDate: null,
        endDate: null,
        timezone: null,
        recurrence: 'WEEKLY',
        weekdays: ['SA'],
        endTime: null,
        inactive: false,
      },
      address: {
        venueName: 'Community Hall',
        street: '12 Beethoven Street',
        room: null,
        city: 'London',
        region: null,
        postCode: 'W10',
        country: 'GB',
        latitude: 51.5,
        longitude: -0.2,
        oneLine: '12 Beethoven Street, London, GB W10',
      },
      onlineUrl: null,
      website: null,
      paragraphs: ['A weekly class for beginners.'],
      images: [{ url: 'https://assets.test/a.jpg', alt: 'The hall' }],
      ...content,
    },
  } as AtlasSeoResponse
}

const render = (seo: AtlasSeoResponse) => renderToStaticMarkup(<AtlasContent seo={seo} />)

describe('atlasHref', () => {
  it('prefers the canonical, which may live on another owner’s domain', () => {
    // Ownership is per-subtree, so linking anywhere else would build a link
    // graph pointing at URLs we ourselves declare non-canonical.
    expect(atlasHref({ route: '/gb/london', url: 'https://other.org/classes/gb/london' })).toBe(
      'https://other.org/classes/gb/london',
    )
  })

  it('falls back to our own /map path when no owner can publish one', () => {
    expect(atlasHref({ route: '/gb/london', url: null })).toBe('/map/gb/london')
  })

  it('returns null when there is neither, so nothing renders a dead link', () => {
    expect(atlasHref({ route: null, url: null })).toBeNull()
  })
})

describe('a region page', () => {
  it('renders the region as the page heading', () => {
    const html = render(regionSeo())

    expect(html).toContain('<h1')
    expect(html).toContain('London')
    expect(html).toContain('Greater London')
  })

  it('lists its classes with schedule and address, linked to the canonical', () => {
    const html = render(regionSeo())

    expect(html).toContain('Saturday morning meditation')
    expect(html).toContain('Every week on Saturday at 9:30 AM')
    expect(html).toContain('12 Beethoven Street, London')
    expect(html).toContain('href="https://wemeditate.com/map/gb/london/1204"')
  })

  it('says a listing is partial rather than passing a cap off as the whole', () => {
    const html = render(regionSeo({ eventCount: 137 }))

    expect(html).toContain('Showing 1 of 137 classes.')
  })

  it('does not claim a partial listing when it is complete', () => {
    expect(render(regionSeo())).not.toContain('Showing')
  })

  it('says so plainly when a region lists nothing yet', () => {
    const html = render(regionSeo({ events: [], eventCount: 0 }))

    expect(html).toContain('No meditation classes are listed here yet.')
  })

  it('marks an online class as online instead of showing a blank address', () => {
    const html = render(
      regionSeo({
        events: [
          {
            id: 9,
            route: '/gb/london/9',
            url: null,
            title: 'Online sitting',
            schedule: 'Daily at 7 PM',
            address: '',
            online: true,
          },
        ],
      }),
    )

    expect(html).toContain('Online')
  })

  it('renders ancestry as a breadcrumb, with the current page not a link', () => {
    const html = render(regionSeo())

    expect(html).toContain('aria-label="Breadcrumb"')
    expect(html).toContain('href="https://wemeditate.com/map/gb"')
    expect(html).toContain('aria-current="page"')
  })
})

describe('a class page', () => {
  it('renders when and where it meets', () => {
    const html = render(eventSeo())

    expect(html).toContain('Every week on Saturday at 9:30 AM')
    expect(html).toContain('12 Beethoven Street, London, GB W10')
  })

  it('renders the description as text, never as markup', () => {
    // `paragraphs` is plain text by contract — upstream converts Lexical to text
    // precisely so no consumer has to sanitize it.
    const html = render(eventSeo({ paragraphs: ['Bring <b>a cushion</b> & a friend'] }))

    expect(html).toContain('Bring &lt;b&gt;a cushion&lt;/b&gt; &amp; a friend')
    expect(html).not.toContain('<b>a cushion</b>')
  })

  it('shows the lead image with its alt text', () => {
    const html = render(eventSeo())

    expect(html).toContain('src="https://assets.test/a.jpg"')
    expect(html).toContain('alt="The hall"')
  })

  it('offers the join link for an online class', () => {
    const html = render(
      eventSeo({ onlineUrl: 'https://meet.test/room', address: null }),
    )

    expect(html).toContain('href="https://meet.test/room"')
    expect(html).toContain('Join online')
  })

  it('omits the link entirely when there is neither an online room nor a website', () => {
    const html = render(eventSeo())

    expect(html).not.toContain('Join online')
    expect(html).not.toContain('Visit the website')
  })
})
