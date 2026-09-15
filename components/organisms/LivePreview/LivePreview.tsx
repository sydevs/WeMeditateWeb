import { useOptionalPageContext } from '../../../hooks/useT'
import { useLivePreviewLinkGuard } from '../../../lib/preview-navigation'

/**
 * Mounts the live-preview behaviours that apply to a whole page.
 *
 * Rendered once from `LayoutRoot`, so it covers every route — including the
 * bare `embed` ones, which opt into no chrome and are exactly what the
 * meditation frame editor points at.
 *
 * ## Why here, and not per route
 *
 * Preview is no longer a route. Any page renders drafts when the URL carries a
 * valid token, so the behaviours have to attach somewhere every page passes
 * through. `LayoutRoot` already owns the things with that shape: the error
 * boundary and the route announcer.
 *
 * ## It renders nothing, deliberately
 *
 * There is no banner. The panel sits inside the CMS admin, whose own chrome
 * already says Live Preview, and a fixed bar would overlap the site header and
 * eat the top of a 375×667 meditation embed. The repo carried an unrendered
 * `PreviewBanner` for a year; nobody missed it.
 */
export function LivePreview() {
  // `useOptionalPageContext`, the same accessor `ContentHead` uses: this
  // mounts from `LayoutRoot`, which renders in Ladle and in SSR-string tests
  // where no Vike provider exists. `usePageContext` throws there, and taking
  // the root layout down over a preview flag would be a poor trade.
  const pageContext = useOptionalPageContext()
  const active = pageContext?.livePreview?.active === true

  // The guard takes `active` rather than being mounted behind a branch — a
  // hook cannot be called conditionally, and it attaches no listener when
  // false, so the ordinary site pays nothing.
  useLivePreviewLinkGuard(active)

  return null
}
