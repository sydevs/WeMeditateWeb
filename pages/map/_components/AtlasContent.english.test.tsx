/**
 * Proves relativizing an atlas canonical does not invent an `/en` prefix.
 *
 * English is served bare, so `/en/map/gb` is a URL that 301s. The sibling
 * French suite cannot show this: the `pageContext` mock is module-wide, and
 * "keeps `/fr`" and "adds no `/en`" are opposite answers from one code path.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { AtlasSeoResponse } from '../../../server/atlas-types'

const ORIGIN = 'https://wemeditate.com'

vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => ({ locale: 'en', urlParsed: { origin: ORIGIN } }),
}))

const { AtlasContent } = await import('./AtlasContent')

const seo = {
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
    { name: 'United Kingdom', route: '/gb', url: `${ORIGIN}/map/gb` },
    { name: 'London', route: '/gb/london', url: `${ORIGIN}/map/gb/london` },
  ],
  content: {
    name: 'London',
    subtitle: 'Greater London',
    level: 'city',
    events: [
      {
        id: 1204,
        route: '/gb/london/1204',
        url: `${ORIGIN}/map/gb/london/1204`,
        title: 'Saturday morning meditation',
        schedule: 'Every week on Saturday at 9:30 AM',
        address: '12 Beethoven Street, London',
        online: false,
      },
    ],
    eventCount: 1,
  },
} as AtlasSeoResponse

describe('an atlas page in English', () => {
  it('links a rung and a card bare, never through an /en redirect', () => {
    const html = renderToStaticMarkup(<AtlasContent seo={seo} />)

    expect(html).toContain(`href="/map/gb"`)
    expect(html).toContain(`href="/map/gb/london/1204"`)
    expect(html).not.toContain('/en/map/')
  })
})
