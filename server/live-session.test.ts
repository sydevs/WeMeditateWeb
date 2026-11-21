import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Sentry from '@sentry/react'
import { forgetReportedWarnings } from './error-utils'
import { reportLiveSessionGaps } from './live-session'

// `warnOnce` reports through `@sentry/react` (see error-utils.ts).
vi.mock('@sentry/react', () => ({ captureMessage: vi.fn() }))

const ONLINE = {
  eventType: 'online',
  onlineUrl: 'https://example.invalid/room',
  schedule: { firstDate_tz: 'Europe/London', upcomingDates: ['2099-10-20T18:00:00.000Z'] },
}

const IMAGE = { url: 'https://imagedelivery.net/acct/fixture/public', width: 1600, height: 900 }

const content = (...events: unknown[]) => ({
  root: {
    type: 'root',
    children: events.map((event) => ({
      type: 'block',
      fields: { blockType: 'splash', layout: 'countdown', images: [IMAGE], event },
    })),
  },
})

beforeEach(() => {
  forgetReportedWarnings()
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

  it('reports nothing for a countdown splash that renders nothing', () => {
    // No background image, so the converter returns `null` before the class is
    // ever read — there is no block on the page for its class to be a gap of.
    reportLiveSessionGaps(
      {
        root: {
          type: 'root',
          children: [
            { type: 'block', fields: { blockType: 'splash', layout: 'countdown', event: 1506 } },
          ],
        },
      },
      { slug: 'imageless' },
    )

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

  it('reads the root children, and no deeper', () => {
    // Every page block is a child of the root upstream, so a deep walk would
    // recurse through a whole depth-3 document on the TTFB path for nothing.
    const nested = {
      root: {
        type: 'root',
        children: [
          { type: 'block', fields: { blockType: 'layout', items: content(1506).root.children } },
        ],
      },
    }

    reportLiveSessionGaps(nested, { slug: 'nested' })

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
