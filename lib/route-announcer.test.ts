import { describe, expect, it, vi } from 'vitest'

import {
  announceRouteChange,
  MAIN_CONTENT_ID,
  ROUTE_ANNOUNCER_ID,
  type AnnouncerDocument,
} from './route-announcer'

/**
 * A stand-in for the two elements this touches. The lane is node-only with no
 * jsdom (`docs/rules/testing.md`), and a fake is honest here rather than a
 * compromise: the contract under test is "which element is looked up, and what
 * is done to it", which is exactly what these record.
 */
function stubDocument(
  title: string,
  { withAnnouncer = true, withMain = true }: { withAnnouncer?: boolean; withMain?: boolean } = {},
) {
  const announcer = { textContent: 'stale — must be overwritten' }
  const main = { focus: vi.fn() }

  const doc: AnnouncerDocument = {
    title,
    getElementById: (id) => {
      if (id === ROUTE_ANNOUNCER_ID) return withAnnouncer ? announcer : null
      if (id === MAIN_CONTENT_ID) return withMain ? main : null
      return null
    },
  }

  return { doc, announcer, main }
}

describe('announceRouteChange', () => {
  it('announces the new title and moves focus into the page', () => {
    const { doc, announcer, main } = stubDocument('Meditate — We Meditate')

    announceRouteChange(doc, { isBackwardNavigation: false })

    expect(announcer.textContent).toBe('Meditate — We Meditate')
    expect(main.focus).toHaveBeenCalledWith({ preventScroll: true })
  })

  it('announces but does NOT move focus on a back/forward navigation', () => {
    const { doc, announcer, main } = stubDocument('Articles — We Meditate')

    announceRouteChange(doc, { isBackwardNavigation: true })

    // The page still changed, so it is still announced...
    expect(announcer.textContent).toBe('Articles — We Meditate')
    // ...but focusing <main> would scroll to the top and undo the browser's
    // restored scroll position, losing the reader's place.
    expect(main.focus).not.toHaveBeenCalled()
  })

  it('treats a null isBackwardNavigation as a forward navigation', () => {
    // Vike passes null on a first render rather than false.
    const { doc, main } = stubDocument('Home — We Meditate')

    announceRouteChange(doc, { isBackwardNavigation: null })

    expect(main.focus).toHaveBeenCalledOnce()
  })

  it('does not throw when either element is missing', () => {
    // The IDs are shared constants, precisely so this cannot happen. But
    // the failure mode if one ever drifts is a silent null, never a
    // crash that takes the navigation down with it.
    const noAnnouncer = stubDocument('X', { withAnnouncer: false })
    expect(() => announceRouteChange(noAnnouncer.doc, { isBackwardNavigation: false })).not.toThrow()
    expect(noAnnouncer.main.focus).toHaveBeenCalledOnce()

    const noMain = stubDocument('X', { withMain: false })
    expect(() => announceRouteChange(noMain.doc, { isBackwardNavigation: false })).not.toThrow()
    expect(noMain.announcer.textContent).toBe('X')
  })
})
