/**
 * Named without the `+` its subject carries. Vike loads every `+`-prefixed
 * file under `pages/` as a config file, and rejects one that exports no
 * `route` and no `default`. That failure shows up in the build, not the
 * test run.
 */
import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import type { LectureEmbedPageData } from './+data'
import { CF_BASE } from '../../../../tests/_helpers/cloudflare-images'

const pageData: { current: LectureEmbedPageData } = {
  current: null as unknown as LectureEmbedPageData,
}

vi.mock('vike-react/useData', () => ({ useData: () => pageData.current }))
// The player is browser-only, so server-side it renders the poster fallback.
// That fallback is the markup this route's `sizes` reaches.
vi.mock('vike-react/ClientOnly', () => ({
  ClientOnly: ({ fallback }: { fallback?: ReactNode }) => fallback ?? null,
}))

const { Page } = await import('./+Page')

describe('lecture embed page', () => {
  // Nothing caps the player here, so the poster's box is the iframe's width.
  // The default assumes the `max-w-4xl` the in-app routes impose, which left
  // a 1280-1920px iframe with a 1024px poster (#146).
  it('declares the poster at the iframe width, not the bounded default', () => {
    pageData.current = {
      lecture: {
        id: 1,
        type: 'full',
        title: 'The Subtle System',
        hlsUrl: 'https://cdn.nv/full.m3u8',
        thumbnailUrl: `${CF_BASE}/public`,
        duration: 600,
        startTime: null,
        stopTime: null,
        subtitles: [],
      },
      locale: 'en',
    } as unknown as LectureEmbedPageData

    const html = renderToStaticMarkup(<Page />)

    expect(html).toContain('sizes="100vw"')
    expect(html).toContain(`${CF_BASE}/width=1536 1536w`)
  })
})
