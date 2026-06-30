/**
 * Live-preview navigation guard
 *
 * Preview routes (/preview and /preview/embed) render the real site components,
 * so every link on screen is genuine navigation. When an editor clicks one
 * inside the SahajCloud live-preview iframe, the iframe leaves the document
 * being edited and the live-preview session breaks. This guard makes links
 * inert WITHOUT threading a "disabled" prop through every component (Link atom,
 * Button-as-link, Breadcrumbs, cards, nav, footer): a single capture-phase
 * click interceptor blocks anchor navigation across the whole preview tree —
 * including the Header/Footer chrome that LayoutChrome renders OUTSIDE
 * <Preview>.
 */

import { useEffect } from 'react'

/**
 * Whether a click on an in-preview anchor should be blocked.
 *
 * Same-page hash links (`#heading`) are table-of-contents jumps editors use to
 * scroll within the document being edited — keep them working. Everything else
 * (internal route, external, `mailto:`, `tel:`, …) navigates away and is made
 * inert.
 *
 * Pass the anchor's href *attribute* (`getAttribute('href')`), not the resolved
 * `.href` DOM property, so a bare `#heading` stays detectable instead of being
 * expanded to an absolute URL.
 */
export function shouldBlockPreviewLink(rawHref: string | null | undefined): boolean {
  // <a> without an href doesn't navigate — nothing to block.
  if (!rawHref) return false
  // Same-page anchor (table-of-contents jump): leave it alone so it scrolls.
  if (rawHref.startsWith('#')) return false

  // Internal route, external, mailto, tel, … → inert in preview.
  return true
}

/**
 * Make every link in the live-preview routes inert so editors can read and
 * scroll without the iframe navigating away from the document being edited.
 *
 * Mechanism: a capture-phase listener on `window`, which fires before Vike's
 * client-router click handler (a bubble-phase listener on `document` that does
 * NOT check `defaultPrevented`). For a blocked anchor we therefore call BOTH:
 *   - `preventDefault()` — stops native navigation / open-in-new-tab, and
 *   - `stopPropagation()` — keeps the event from reaching Vike's client router.
 *
 * `auxclick` is covered too, since that is where browsers fire middle-click
 * "open in new tab". Only `<a>` is touched, so `<button>` and media controls
 * (play/pause, captions, the embed dropdown) keep working, and the
 * `message`-based live-preview content updates and seek sync are untouched. The
 * listener is mounted only while a preview route renders <Preview>, so the
 * normal site navigates exactly as before.
 */
export function usePreviewLinkGuard(): void {
  useEffect(() => {
    const blockAnchorNavigation = (event: MouseEvent) => {
      const target = event.target

      if (!(target instanceof Element)) return

      const anchor = target.closest('a')

      if (!anchor) return // not a link — let buttons / media controls work

      if (!shouldBlockPreviewLink(anchor.getAttribute('href'))) return // #hash: allow

      // Block native navigation AND stop the event before Vike's document-level
      // client-router handler can run its client-side navigation.
      event.preventDefault()
      event.stopPropagation()
    }

    // Capture phase on `window` runs before any document-level handler.
    window.addEventListener('click', blockAnchorNavigation, true)
    // `auxclick` is where browsers fire middle-click "open in new tab".
    window.addEventListener('auxclick', blockAnchorNavigation, true)

    return () => {
      window.removeEventListener('click', blockAnchorNavigation, true)
      window.removeEventListener('auxclick', blockAnchorNavigation, true)
    }
  }, [])
}
