/**
 * Named without the `+` its subject carries. Vike loads every `+`-prefixed
 * file under `pages/` as a config file, and rejects one that exports no
 * `route` and no `default`. That failure shows up in the build, not the test
 * run. This test still lives next to its subject.
 *
 * ## The fixture is a raw Lecture, not a ResolvedLecture
 *
 * That is the whole change here, so a fixture in the resolved shape would
 * pass against the bug. `LECTURE_SELECT` and `LECTURE_POPULATE`
 * (`server/sahajcloud/`) are what the server render and the populate
 * round trip both ask for, so a clip's `fullLecture` arrives as a populated
 * document carrying the parent's `metadata`. The clip below is that shape.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import type { Lecture } from '@/types/sahajcloud'
import { enT } from '@/lib/i18n/i18n'
import { openTag } from '@/tests/_helpers/markup'
import type { LecturePageData } from './+data'

const PARENT_METADATA: Record<string, unknown> = {
  title: 'The Subtle System',
  thumbnailUrl: 'https://cdn.nv/thumb.jpg',
  hlsUrl: 'https://cdn.nv/full.m3u8',
  duration: 3600,
  subtitles: { en: 'https://cdn.nv/en.vtt' },
}

/** A populated `fullLecture`, as `LECTURE_POPULATE` returns one. */
function parent(metadata: Record<string, unknown>): Lecture {
  return { id: 2, type: 'full', metadata } as unknown as Lecture
}

function makeClip(overrides: Partial<Lecture> = {}): Lecture {
  return {
    id: 9,
    type: 'clip',
    title: 'Saved title',
    thumbnail: null,
    startTime: 60,
    stopTime: 180,
    subtitles: null,
    metadata: null,
    fullLecture: parent(PARENT_METADATA),
    ...overrides,
  } as unknown as Lecture
}

const pageData: { current: LecturePageData } = {
  current: null as unknown as LecturePageData,
}

/** The server render: the raw document, which is what both routes carry. */
function serverRendered(document: Lecture): void {
  pageData.current = {
    lecture: document,
    locale: 'en',
    id: String(document.id),
  } as LecturePageData
}

/** What the panel streams next, or `null` to replay `initialData`. */
const streamed: { current: Lecture | null } = { current: null }

/** What the route asked the subscriber to mount on. */
const subscriber: { slug?: string; initialData?: Lecture } = {}

vi.mock('vike-react/useData', () => ({ useData: () => pageData.current }))
// `usePageHead` writes the document title through vike-react's config, which
// needs a Vike app.
vi.mock('vike-react/useConfig', () => ({ useConfig: () => () => {} }))
// `RelatedContentLoader` reads the locale off the page context.
vi.mock('vike-react/usePageContext', () => ({ usePageContext: () => ({ locale: 'en' }) }))
// The player is browser-only, so server-side it renders the poster fallback.
vi.mock('vike-react/ClientOnly', () => ({
  ClientOnly: ({ fallback }: { fallback?: ReactNode }) => fallback ?? null,
}))
// The transport is Payload's and needs a session. Stand in for it, recording
// what it was mounted with and replaying whatever the panel last sent.
vi.mock('@/lib/live-preview/document', () => ({
  LivePreviewDocument: ({
    children,
    initialData,
    slug,
  }: {
    children: (lecture: Lecture) => ReactNode
    initialData: Lecture
    slug: string
  }) => {
    subscriber.slug = slug
    subscriber.initialData = initialData

    return children(streamed.current ?? initialData)
  },
}))

const { Page } = await import('./+Page')

beforeEach(() => {
  delete subscriber.slug
  delete subscriber.initialData
  streamed.current = null
})

describe('the full lecture route', () => {
  it('renders the saved lecture when the panel streams nothing', () => {
    serverRendered(makeClip())

    const html = renderToStaticMarkup(<Page />)

    expect(html).toContain('Saved title')
  })

  it('subscribes the lectures collection to the document the server read', () => {
    const clip = makeClip()

    serverRendered(clip)

    renderToStaticMarkup(<Page />)

    expect(subscriber.slug).toBe('lectures')
    expect(subscriber.initialData).toBe(clip)
  })

  it('resolves what the panel streams, so an unsaved title reaches the page', () => {
    serverRendered(makeClip())
    streamed.current = makeClip({ title: 'Unsaved title' })

    const html = renderToStaticMarkup(<Page />)

    expect(html).toContain('Unsaved title')
    expect(html).not.toContain('Saved title')
  })

  it('plays a streamed clip from its parent, inside the streamed clip window', () => {
    serverRendered(
      makeClip({
        startTime: 0,
        stopTime: 60,
        fullLecture: parent({ ...PARENT_METADATA, thumbnailUrl: 'https://cdn.nv/old.jpg' }),
      }),
    )
    streamed.current = makeClip({ startTime: 60, stopTime: 180 })

    const html = renderToStaticMarkup(<Page />)

    // The poster is the streamed parent's, reached through `fullLecture`.
    expect(openTag(html, 'img')).toContain('src="https://cdn.nv/thumb.jpg"')
    expect(html).not.toContain('https://cdn.nv/old.jpg')
    // 120s of window, not the saved 60s and not the parent's 3600s source.
    expect(html).toContain('2 min')
    expect(html).not.toContain('1 min')
  })

  it('stands a heading in for a streamed document with no title anywhere', () => {
    serverRendered(makeClip())
    streamed.current = makeClip({
      title: null,
      fullLecture: parent({ ...PARENT_METADATA, title: undefined }),
    })

    const html = renderToStaticMarkup(<Page />)

    expect(html).toContain(enT('lecture.a11y.untitled_heading'))
  })
})
