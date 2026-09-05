/**
 * Route-change announcement and focus management for Vike Client Routing.
 *
 * Client Routing swaps the page under `<main>` while the chrome persists.
 * None of the things a full page load does for free happen here: focus
 * is not reset, and `document.title` changes with nothing to speak it. A
 * screen-reader user gets no signal that the page changed at all, a WCAG
 * 2.1 4.1.3 (AA) gap.
 *
 * The IDs live here, instead of being typed at each of the three call
 * sites (LayoutRoot renders the announcer, LayoutChrome and LayoutMap
 * mark the target, the transition hook looks both up), because a
 * drifting string would fail silently: `getElementById` returns null,
 * and the optional chain swallows it.
 */

/** The polite live region rendered once by `LayoutRoot`. */
export const ROUTE_ANNOUNCER_ID = 'route-announcer'

/** The `<main>` element each layout marks as the programmatic focus target. */
export const MAIN_CONTENT_ID = 'main-content'

/** The slice of `HTMLElement` this touches. */
export interface AnnouncerElement {
  textContent?: string | null
  focus?: (options?: { preventScroll?: boolean }) => void
}

/** The slice of `Document` this needs. Small enough to fake in the node test lane. */
export interface AnnouncerDocument {
  title: string
  getElementById(id: string): AnnouncerElement | null
}

export interface RouteChange {
  /**
   * Vike's `pageContext.isBackwardNavigation`. `null` on a first render,
   * and `undefined` when Server Routing means there was no client
   * transition at all. Both mean "not a back or forward navigation," so
   * both take the focus branch.
   */
  isBackwardNavigation: boolean | null | undefined
}

/**
 * Announces the new page and moves focus into it.
 *
 * Focus does not move on a back or forward navigation. The browser
 * restores the previous scroll position there, and focusing `<main>`
 * would scroll back to the top and undo it. Going Back would then lose
 * the reader's place. The announcement still happens, because the page
 * changed either way.
 */
export function announceRouteChange(doc: AnnouncerDocument, { isBackwardNavigation }: RouteChange) {
  const announcer = doc.getElementById(ROUTE_ANNOUNCER_ID)
  if (announcer) {
    // Assigning `textContent` is what the live region reacts to.
    announcer.textContent = doc.title
  }

  if (isBackwardNavigation) return

  const main = doc.getElementById(MAIN_CONTENT_ID)
  // `preventScroll`, because the element is already at the top of the
  // new page. Letting the browser scroll to it fights the router's own scroll reset.
  main?.focus?.({ preventScroll: true })
}
