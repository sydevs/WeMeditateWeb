/**
 * Live preview: the vocabulary both halves share.
 *
 * Live preview is split in two, and this file is what the two agree on.
 *
 * - **`server/live-preview.ts` — the credential.** Reads `?live-preview=` off
 *   the request, verifies the Ed25519 signature against a committed public
 *   key, and holds the token. It is never bundled for the browser.
 * - **`lib/live-preview/*` — the browser behaviours.** The unsaved-edit
 *   stream, the link guard, the address-bar scrub and the meditation frame
 *   channel. These are bundled for the browser, and so are never allowed to
 *   see the token.
 *
 * Everything in this file is client-safe by construction: parameter names, a
 * closed set of scope slugs, and the shape of the verdict. No secret, no
 * `crypto`, no `pageContext`. Both halves import it, which is the point — the
 * parameter name used to be spelled once here and once in the server module,
 * with a comment asking the two to stay in step.
 */

/** The query parameter carrying the token. Matches SahajAtlasWeb's spelling. */
export const LIVE_PREVIEW_PARAM = 'live-preview'

/** The query parameter naming what the admin panel is editing. */
export const LIVE_PREVIEW_SCOPE_PARAM = 'scope'

/**
 * What the panel is editing, when it is not the route's own document.
 *
 * A closed set: an unrecognised value falls back to the default rather than
 * widening what reads drafts. Every value here is emitted by exactly one
 * `livePreview.url` in SahajCloud.
 */
export type LivePreviewScope = 'wm-web-translations' | 'wm-web-config'

const SCOPES: ReadonlySet<string> = new Set(['wm-web-translations', 'wm-web-config'])

/** Narrows a raw `scope` parameter to the closed set, or `null`. */
export function readLivePreviewScope(raw: string | undefined): LivePreviewScope | null {
  return raw && SCOPES.has(raw) ? (raw as LivePreviewScope) : null
}

/**
 * The verdict for one request, as the BROWSER sees it.
 *
 * ⚠ **This shape is in `passToClient`, so everything on it is public.** The
 * token is deliberately absent: the client needs to know it is in a preview so
 * the link guard attaches and the message listener subscribes, and it must
 * never learn the credential that unlocked it. `LivePreviewSession` in
 * `server/live-preview.ts` is this plus the token, and stays on the server.
 */
export interface LivePreviewState {
  active: boolean
  /** `null` means the route's own primary document reads drafts. */
  scope: LivePreviewScope | null
}

/** The verdict for every ordinary request, and the client-side fallback. */
export const LIVE_PREVIEW_INACTIVE: LivePreviewState = { active: false, scope: null }
