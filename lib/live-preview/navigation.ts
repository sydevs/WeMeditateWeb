/**
 * Live preview: making links inert while the panel is open.
 *
 * ⚠ **Preview is no longer a route.** Any page renders drafts when the URL
 * carries a valid token, so this attaches on every page and decides from the
 * session rather than from where it was mounted.
 *
 * Every link on screen is genuine navigation. When an editor clicks one inside
 * the SahajCloud live-preview iframe, the iframe leaves the document being
 * edited and the session breaks — and the token has been scrubbed from the
 * address bar by then, so there is no going back without reopening the panel.
 *
 * This guard makes links inert without threading a "disabled" prop through
 * every component (Link atom, Button-as-link, Breadcrumbs, cards, nav,
 * footer). A single capture-phase click interceptor blocks anchor navigation
 * across the whole tree, including the Header/Footer chrome.
 *
 * ## Why a hook and not a component
 *
 * This was briefly `components/organisms/LivePreview`, which rendered `null`.
 * It is behaviour, not UI: nothing to look at, no markup, no props, no story,
 * nothing atomic design has a shelf for. `LayoutRoot` calls it directly, the
 * way `lib/route-announcer.ts` is called from `pages/+onPageTransitionEnd.ts`.
 */

import { useEffect } from 'react'

import { useLivePreviewState } from './session'

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
 * Make every link inert while a live-preview session is open, so editors can
 * read and scroll without the iframe navigating away from the document being
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
 * working. The `message`-based content updates and seek sync stay untouched.
 *
 * Any open session guards, scoped or not: a translations preview is still an
 * iframe that must not navigate away. Off-preview no listener is attached at
 * all, so the ordinary site pays nothing — this runs on every page now.
 */
export function useLivePreviewLinkGuard(): void {
  const { active } = useLivePreviewState()

  useEffect(() => {
    if (!active) return
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
  }, [active])
}
