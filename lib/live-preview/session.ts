import { useOptionalPageContext } from '../../hooks/usePageContext'
import { LIVE_PREVIEW_INACTIVE, type LivePreviewState } from './protocol'

/**
 * Live preview: what the BROWSER knows about the session.
 *
 * ## There is already a provider; this is the accessor it was missing
 *
 * `pageContext.livePreview` is put there by `pages/+onBeforeRender.ts` and
 * carried over by `passToClient`. vike-react publishes `pageContext` through a
 * React context, so the provider a component wants already exists and already
 * wraps every route — wrapping it in a second context of our own would
 * re-broadcast a value the tree can already read, and add a hydration boundary
 * for nothing.
 *
 * What was actually missing is a NAME. Two call sites each spelled
 * `livePreview?.active === true && livePreview.scope === null` by hand, which
 * is a condition with a meaning ("the panel is editing THIS route's document")
 * and one wrong `===` away from showing a translator's unsaved strings as a
 * page draft. That lives here now.
 *
 * ## Why the server half cannot use a provider at all
 *
 * The `+data.ts` functions thread `preview`/`previewToken` into each CMS read.
 * No React context can reach them: they run on the server before any component
 * renders, and the token they pass is the one thing `passToClient` must never
 * carry. `previewArgs` in `server/live-preview.ts` is the equivalent there —
 * one named helper rather than one provider.
 */

/** The live-preview verdict for this page, or the inactive one off-preview. */
export function useLivePreviewState(): LivePreviewState {
  // `useOptionalPageContext` is the guarded accessor: this is read from
  // `LayoutRoot`, which also renders in Ladle and in SSR-string tests where no
  // Vike provider exists. `usePageContext` hands back `undefined` there while
  // claiming otherwise, and taking the root layout down over a preview flag
  // would be a poor trade.
  return useOptionalPageContext()?.livePreview ?? LIVE_PREVIEW_INACTIVE
}

/**
 * Whether the panel is editing THIS route's own document.
 *
 * A scoped session (`wm-web-translations`, `wm-web-config`) is a live preview
 * of something else, rendered on this page. The page itself stays published,
 * so a translator sees their strings on the real article rather than on
 * someone's unrelated draft — and the unsaved-edit stream for the page must
 * stay shut.
 */
export function useDocumentPreviewActive(): boolean {
  const { active, scope } = useLivePreviewState()

  return active && scope === null
}

/**
 * The CMS origin `postMessage` traffic is accepted from and sent to.
 *
 * ⚠ **`undefined` when `PUBLIC__SAHAJCLOUD_URL` is unset or unparseable, and
 * every caller must fail CLOSED on that.** An earlier version fell back to
 * `'*'`, which turned the meditation seek channel into one any page could
 * drive.
 */
export function sahajCloudOrigin(): string | undefined {
  const url = import.meta.env.PUBLIC__SAHAJCLOUD_URL

  if (!url) return undefined

  try {
    return new URL(url).origin
  } catch {
    return undefined
  }
}
