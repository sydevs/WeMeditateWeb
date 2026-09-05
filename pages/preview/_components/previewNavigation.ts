/**
 * Live-preview navigation guard.
 *
 * Preview routes (/preview and /preview/embed) render the real site
 * components, so every link on screen is genuine navigation. When an
 * editor clicks one inside the SahajCloud live-preview iframe, the iframe
 * leaves the document being edited, and the live-preview session breaks.
 *
 * This guard makes links inert without threading a "disabled" prop
 * through every component (Link atom, Button-as-link, Breadcrumbs, cards,
 * nav, footer). A single capture-phase click interceptor blocks anchor
 * navigation across the whole preview tree, including the Header/Footer
 * chrome that LayoutChrome renders outside `<Preview>`.
 */

import { useEffect } from 'react'

/**
 * Whether to block a click on an in-preview anchor.
 *
 * Same-page hash links (`#heading`) are table-of-contents jumps. Editors
 * use them to scroll within the document being edited, so this keeps
 * them working. Everything else (internal route, external, `mailto:`,
 * `tel:`, and more) navigates away, so this blocks it.
 *
 * Pass the anchor's href attribute (`getAttribute('href')`), not the
 * resolved `.href` DOM property. This keeps a bare `#heading` detectable,
 * instead of expanded to an absolute URL.
 */
export function shouldBlockPreviewLink(rawHref: string | null | undefined): boolean {
  // <a> without an href does not navigate. Nothing to block.
  if (!rawHref) return false
  // Same-page anchor (table-of-contents jump): leave it alone, so it scrolls.
  if (rawHref.startsWith('#')) return false

  // Internal route, external, mailto, tel, and more: inert in preview.
  return true
}

/**
 * Make every link in the live-preview routes inert, so editors can read
 * and scroll without the iframe navigating away from the document being
 * edited.
 *
 * Mechanism: a capture-phase listener on `window`, which fires before
 * Vike's client-router click handler (a bubble-phase listener on
 * `document` that does not check `defaultPrevented`). For a blocked
 * anchor, this calls both:
 *   - `preventDefault()` — stops native navigation and open-in-new-tab
 *   - `stopPropagation()` — keeps the event from reaching Vike's client router
 *
 * This also covers `auxclick`, because that is where browsers fire
 * middle-click "open in new tab". Only `<a>` is touched, so `<button>`
 * and media controls (play/pause, captions, the embed dropdown) keep
 * working. The `message`-based live-preview content updates and seek
 * sync stay untouched. The listener mounts only while a preview route
 * renders `<Preview>`, so the normal site navigates exactly as before.
 */
export function usePreviewLinkGuard(): void {
  useEffect(() => {
    const blockAnchorNavigation = (event: MouseEvent) => {
      const target = event.target

      if (!(target instanceof Element)) return

      const anchor = target.closest('a')

      if (!anchor) return // not a link — let buttons / media controls work

      if (!shouldBlockPreviewLink(anchor.getAttribute('href'))) return // #hash: allow

      // Block native navigation, and stop the event before Vike's
      // document-level client-router handler can run its client-side
      // navigation.
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
