/**
 * The branch `AtlasContent.test.tsx` cannot reach.
 *
 * That suite renders with no `pageContext`, so `useOrigin()` is `null` and
 * every canonical reads as foreign. Recognising one as ours needs an origin
 * to compare against, and the `pageContext` mock is module-wide.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { AtlasSeoResponse } from '../../../server/atlas-types'

const ORIGIN = 'https://wemeditate.com'

vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => ({ locale: 'en', urlParsed: { origin: 'https://wemeditate.com' } }),
}))

const { AtlasContent } = await import('./AtlasContent')

function regionSeo(url: string): AtlasSeoResponse {
  return {
    type: 'region',
    id: 5,
    route: '/gb/london',
    locale: 'en',
    title: 'London, United Kingdom',
    description: null,
    canonical: `${ORIGIN}/map/gb/london`,
    alternates: [],
    openGraph: {},
    jsonLd: '{}',
    breadcrumbs: [
      { name: 'United Kingdom', route: '/gb', url },
      { name: 'London', route: '/gb/london', url: `${ORIGIN}/map/gb/london` },
    ],
    content: {
      name: 'London',
      subtitle: null,
      level: 'city',
      events: [
        {
          id: 1204,
          route: '/gb/london/1204',
          url,
          title: 'Saturday morning meditation',
          schedule: 'Every week on Saturday at 9:30 AM',
          address: '12 Beethoven Street, London',
          online: false,
        },
      ],
      eventCount: 1,
    },
  } as AtlasSeoResponse
}

/** The opening `<a>` tag carrying this href, or the empty string. */
function anchorFor(html: string, href: string): string {
  const at = html.indexOf(`href="${href}"`)

  return at === -1 ? '' : html.slice(html.lastIndexOf('<a', at), html.indexOf('>', at) + 1)
}

describe('a canonical this site serves itself', () => {
  it('renders as a path, with neither new-tab nor referrer handling', () => {
    const html = renderToStaticMarkup(<AtlasContent seo={regionSeo(`${ORIGIN}/map/gb`)} />)
    const rung = anchorFor(html, '/map/gb')

    // Positive first: `not.toContain` on an empty match would pass vacuously.
    expect(rung).toContain('href="/map/gb"')
    expect(rung).not.toContain('target=')
    expect(rung).not.toContain('rel=')
    expect(html).not.toContain(ORIGIN)
  })

  it('still marks a rung and a card owned by another domain', () => {
    const html = renderToStaticMarkup(
      <AtlasContent seo={regionSeo('https://other.org/classes/gb')} />,
    )
    const foreign = anchorFor(html, 'https://other.org/classes/gb')

    expect(foreign).toContain('target="_blank"')
    expect(foreign).toContain('rel="noopener noreferrer"')
  })
})
