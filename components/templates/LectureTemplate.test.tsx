import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import type { ResolvedLecture } from '../../server/cms-types'
import { LectureTemplate } from './LectureTemplate'

// VideoPlayer is wrapped in vike-react's ClientOnly, which reads vike's page
// context (absent in a bare node render). Stub it to render its `fallback` —
// exactly what it renders server-side — so we can assert the template's shell:
// title, poster fallback, duration, and the error state.
vi.mock('vike-react/ClientOnly', () => ({
  ClientOnly: ({ fallback }: { fallback?: ReactNode }) => fallback ?? null,
}))

function makeResolved(overrides: Partial<ResolvedLecture> = {}): ResolvedLecture {
  return {
    id: 1,
    type: 'full',
    title: 'The Subtle System',
    hlsUrl: 'https://cdn.nv/full.m3u8',
    thumbnailUrl: 'https://cdn.nv/thumb.jpg',
    duration: 600,
    startTime: null,
    stopTime: null,
    subtitles: [],
    ...overrides,
  }
}

describe('<LectureTemplate>', () => {
  it('renders the title, poster fallback and whole-source duration for a full lecture', () => {
    const html = renderToStaticMarkup(<LectureTemplate lecture={makeResolved()} locale="en" />)

    expect(html).toContain('The Subtle System')
    expect(html).toContain('src="https://cdn.nv/thumb.jpg"') // poster fallback
    expect(html).toContain('10 min') // 600s → 10 min
  })

  it('shows the clip window length (stopTime − startTime), not the source duration', () => {
    const clip = makeResolved({
      type: 'clip',
      duration: 3600, // whole source — should NOT be shown
      startTime: 60,
      stopTime: 180, // 120s window → 2 min
    })

    const html = renderToStaticMarkup(<LectureTemplate lecture={clip} />)

    expect(html).toContain('2 min')
    expect(html).not.toContain('60 min')
  })

  it('degrades to an error message when there is no resolvable HLS source', () => {
    const html = renderToStaticMarkup(<LectureTemplate lecture={makeResolved({ hlsUrl: null })} />)

    expect(html).toContain('missing a playable video source')
    expect(html).not.toContain('The Subtle System')
  })
})
