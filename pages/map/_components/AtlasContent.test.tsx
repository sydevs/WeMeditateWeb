import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { AtlasContent, atlasHref } from './AtlasContent'
import type { AtlasSeoResponse } from '@/types/atlas'
import { anchorFor } from '@/tests/_helpers/markup'

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

/**
 * The atlas root's answer, mirrored from SahajCloud's
 * `src/endpoints/responseTypes.ts`: `id` is `null` on this member alone, and
 * its content carries only paragraphs — no name, level or listing.
 */
function rootSeo(content: Partial<AtlasSeoResponse['content']> = {}): AtlasSeoResponse {
  return {
    type: 'root',
    id: null,
    route: '/',
    locale: 'en',
    title: 'Find a meditation class near you',
    description: 'Free weekly classes, run by volunteers.',
    canonical: 'https://wemeditate.com/map',
    alternates: [],
    openGraph: {},
    jsonLd: '{}',
    breadcrumbs: [],
    content: { paragraphs: ['Every class is free.'], ...content },
  } as AtlasSeoResponse
}

const render = (seo: AtlasSeoResponse) => renderToStaticMarkup(<AtlasContent seo={seo} />)

// Spelled as SahajCloud sends it — docs/rules/testing.md. The endpoint
// passes Payload's virtual `url` through untouched (`seoDocument.ts`).
const CLOUDFLARE_LEAD = { url: 'https://imagedelivery.net/acct/img-id/public', alt: 'The hall' }

describe('atlasHref', () => {
  it('prefers the canonical, which may live on another owner’s domain', () => {
    // Ownership is per-subtree, so linking anywhere else would build a
    // link graph pointing at URLs this app itself declares non-canonical.
    expect(
      atlasHref({ route: '/gb/london', url: 'https://other.org/classes/gb/london' }, null),
    ).toBe('https://other.org/classes/gb/london')
  })

  it('falls back to our own /map path when no owner can publish one', () => {
    expect(atlasHref({ route: '/gb/london', url: null }, null)).toBe('/map/gb/london')
  })

  it('returns null when there is neither, so nothing renders a dead link', () => {
    expect(atlasHref({ route: null, url: null }, null)).toBeNull()
  })

  it('refuses a canonical whose scheme could run in our origin', () => {
    // Nothing upstream validates this field either. The region stays
    // reachable through the path we serve it at.
    expect(atlasHref({ route: '/gb/london', url: 'javascript:alert(1)' }, null)).toBe(
      '/map/gb/london',
    )
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
    // No `pageContext` here, so no origin to recognise the canonical as
    // ours. A served page relativizes it and keeps the visitor's locale.
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

  it('renders the region without classes, rather than throwing, when the listing goes missing', () => {
    // `AtlasSeoResponse` is mirrored from upstream by hand, so a field that
    // stops being sent compiles here and must not turn the page into a 500.
    const html = render(regionSeo({ events: undefined, eventCount: undefined }))

    expect(html).toContain('Greater London')
    expect(html).toContain('No meditation classes are listed here yet.')
  })

  it('renders the page without a breadcrumb, rather than throwing, when the trail goes missing', () => {
    const html = render({ ...regionSeo(), breadcrumbs: undefined } as unknown as AtlasSeoResponse)

    expect(html).toContain('Greater London')
    expect(html).not.toContain('aria-label="Breadcrumb"')
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

  it('offers the join link for an online class, as a link off this site', () => {
    const html = render(eventSeo({ onlineUrl: 'https://meet.test/room', address: null }))
    const room = anchorFor(html, 'https://meet.test/room')

    expect(room).toContain('target="_blank"')
    expect(room).toContain('rel="noopener noreferrer"')
    expect(html).toContain('Join online')
  })

  it('refuses a room URL whose scheme could run in our origin', () => {
    // Nothing upstream validates this field, and it reaches an href
    // unchanged. The website is a separate value, so it still answers.
    const html = render(
      eventSeo({ onlineUrl: 'javascript:alert(1)', website: 'https://site.test' }),
    )

    expect(html).not.toContain('javascript:')
    expect(html).toContain('href="https://site.test"')
    expect(html).toContain('Visit the website')
  })

  it('offers nothing at all when every link a class gives is unusable', () => {
    const html = render(eventSeo({ onlineUrl: 'javascript:alert(1)', website: 'data:text/html,x' }))

    expect(html).not.toContain('javascript:')
    expect(html).not.toContain('data:text/html')
    expect(html).not.toContain('Join online')
    expect(html).not.toContain('Visit the website')
  })

  it('falls through to the website when onlineUrl is empty rather than linking to nothing', () => {
    // Regression: the guard used `||` while the href used `??`, so an empty
    // onlineUrl passed the guard and then rendered href="". Upstream uses the
    // empty string for "absent" elsewhere in this contract.
    const html = render(eventSeo({ onlineUrl: '', website: 'https://site.test' }))

    expect(html).toContain('href="https://site.test"')
    expect(html).toContain('Visit the website')
    expect(html).not.toContain('href=""')
  })

  it('degrades rather than throwing when a hand-mirrored field goes missing', () => {
    // `AtlasSeoResponse` is mirrored from upstream by hand. A field that
    // stops being sent must not turn the page into a 500.
    const html = render(
      eventSeo({ images: undefined, languages: undefined, paragraphs: undefined }),
    )

    expect(html).toContain('Saturday morning meditation')
  })

  it('omits the link entirely when there is neither an online room nor a website', () => {
    const html = render(eventSeo())

    expect(html).not.toContain('Join online')
    expect(html).not.toContain('Visit the website')
  })
})

describe('a canonical owned by another domain', () => {
  // Ownership is per-subtree, so these are real links off this site, not a
  // fallback. Without an origin to compare against, every canonical here
  // reads as foreign — which is what a render outside a request really has.
  it('sends a breadcrumb rung to a new tab, and withholds the referrer', () => {
    const seo = {
      ...regionSeo(),
      breadcrumbs: [
        { name: 'United Kingdom', route: '/gb', url: 'https://other.org/classes/gb' },
        ...breadcrumbs.slice(1),
      ],
    } as AtlasSeoResponse
    const rung = anchorFor(render(seo), 'https://other.org/classes/gb')

    expect(rung).toContain('target="_blank"')
    expect(rung).toContain('rel="noopener noreferrer"')
  })

  it('does the same for an event card', () => {
    const html = render(
      regionSeo({
        events: [
          {
            id: 1204,
            route: '/gb/london/1204',
            url: 'https://other.org/classes/gb/london/1204',
            title: 'Saturday morning meditation',
            schedule: 'Every week on Saturday at 9:30 AM',
            address: '12 Beethoven Street, London',
            online: false,
          },
        ],
        eventCount: 1,
      }),
    )
    const card = anchorFor(html, 'https://other.org/classes/gb/london/1204')

    expect(card).toContain('target="_blank"')
    expect(card).toContain('rel="noopener noreferrer"')
  })

  it('leaves a card that fell back to our own /map path alone', () => {
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
        eventCount: 1,
      }),
    )
    const card = anchorFor(html, '/map/gb/london/9')

    // Positive first: `not.toContain` on an empty match would pass vacuously.
    expect(card).toContain('href="/map/gb/london/9"')
    expect(card).not.toContain('target=')
    expect(card).not.toContain('rel=')
  })
})

describe('the atlas landing page', () => {
  it('heads the page with the answer’s own title, which its content has no name for', () => {
    const html = render(rootSeo())

    expect(html).toContain('<h1')
    expect(html).toContain('Find a meditation class near you')
  })

  it('renders the description paragraphs as text', () => {
    expect(render(rootSeo())).toContain('Every class is free.')
  })

  it('renders the heading alone, rather than throwing, when the copy is missing', () => {
    // Upstream sends an empty array when the landing page has no copy, and
    // `AtlasSeoResponse` is hand-mirrored, so the field could stop arriving.
    const html = render(rootSeo({ paragraphs: undefined }))

    expect(html).toContain('Find a meditation class near you')
    expect(html).not.toContain('<p')
  })
})

describe('an answer this build has never heard of', () => {
  it('renders nothing instead of 500ing the route', () => {
    // The read casts, so a fourth upstream variant arrives here at runtime
    // before `tsc` ever sees it. Returning the narrowed value would hand
    // React an object and throw.
    const future = { ...rootSeo(), type: 'collection' } as unknown as AtlasSeoResponse

    expect(() => render(future)).not.toThrow()
    expect(render(future)).toBe('')
  })
})

describe('<AtlasContent> lead image', () => {
  it('is lazy, and visible to a reader who never hydrates', () => {
    const html = render(eventSeo())
    const lead = html.match(/<img[^>]*a\.jpg[^>]*>/)?.[0]

    expect(lead).toContain('loading="lazy"')
    expect(lead).not.toContain('opacity-0')
    expect(html).not.toContain('rel="preload"')
  })

  it('requests a width variant sized to its column, uncropped', () => {
    const html = render(eventSeo({ images: [CLOUDFLARE_LEAD] }))
    const lead = html.match(/<img[^>]*img-id[^>]*>/)?.[0]

    expect(lead).toContain('src="https://imagedelivery.net/acct/img-id/width=800"')
    expect(lead).toContain('srcSet=')
    // 720px, not the 768px cap: `max-w-3xl` bounds the box with its gutters.
    expect(lead).toContain('720px')
    expect(html).not.toContain('aspect-video')
  })
})
