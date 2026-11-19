import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Sentry from '@sentry/cloudflare'
import { reportLiveSessionGaps } from './live-session'

vi.mock('@sentry/cloudflare', () => ({ captureMessage: vi.fn() }))

const ONLINE = {
  eventType: 'online',
  onlineUrl: 'https://example.invalid/room',
  schedule: { firstDate_tz: 'Europe/London', upcomingDates: ['2099-10-20T18:00:00.000Z'] },
}

const content = (...events: unknown[]) => ({
  root: {
    type: 'root',
    children: events.map((event) => ({
      type: 'block',
      fields: { blockType: 'splash', layout: 'countdown', event },
    })),
  },
})

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.mocked(Sentry.captureMessage).mockClear()
})

describe('reportLiveSessionGaps', () => {
  it('reports a class that is unpublished, removed, or no longer online', () => {
    reportLiveSessionGaps(content(1506, { ...ONLINE, eventType: 'offline' }), {
      slug: 'live',
      locale: 'en',
    })

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1)
    expect(vi.mocked(Sentry.captureMessage).mock.calls[0]?.[1]).toMatchObject({
      level: 'warning',
      extra: { slug: 'live', gaps: ['unpublished or removed', 'no longer an online class'] },
    })
  })

  it.each([
    ['a class that still resolves', ONLINE],
    ['a block an editor has not pointed anywhere yet', undefined],
  ])('reports nothing for %s', (_label, event) => {
    // An unconfigured block is an editor mid-edit, not a data gap — the page
    // already degrades to that language's online classes.
    reportLiveSessionGaps(content(event), { slug: 'live', locale: 'en' })

    expect(Sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('reports nothing for a page with no countdown block at all', () => {
    reportLiveSessionGaps(
      { root: { type: 'root', children: [{ type: 'paragraph' }] } },
      {
        slug: 'about',
      },
    )

    expect(Sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('sends one event per distinct gap per isolate, and warns on every request', () => {
    // This runs per render and nothing caches it, so an unbounded capture
    // bills the quota per page view. Bound the volume, never the level.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    for (let attempt = 0; attempt < 3; attempt += 1) {
      reportLiveSessionGaps(content(2001), { slug: 'repeated', locale: 'en' })
    }

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledTimes(3)

    // A different page is a different signature, and reports at once.
    reportLiveSessionGaps(content(2001), { slug: 'another', locale: 'en' })

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(2)
  })
})
