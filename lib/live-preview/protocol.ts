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
 * The header a live-preview token rides in, on its way back to the CMS.
 *
 * ⚠ The NAME is unchanged and the CONTENTS are not. It used to carry
 * `SAHAJCLOUD_PREVIEW_SECRET` verbatim; it now carries a short-lived signed
 * token. The name stayed because SahajCloud's Cloudflare Cache Rule matches on
 * it and its CORS allowlist names it, and neither cares what the value means.
 *
 * Two senders spell it, which is why it is here rather than in either of them:
 * `server/payload-client.ts` attaches it to every CMS read, and the browser
 * attaches it to {@link LIVE_PREVIEW_POPULATE_PATH}.
 */
export const LIVE_PREVIEW_TOKEN_HEADER = 'x-sahajcloud-preview-secret'

/**
 * The same-origin route that runs Payload's population round trip.
 *
 * The browser cannot call the CMS for it: the API key that unlocks a draft
 * read is a server-only secret, and SahajCloud answers
 * `Access-Control-Allow-Origin: *` with no `Allow-Credentials`, which is the
 * pairing browsers refuse. So the request comes here instead, and
 * `server/api-routes.ts` re-verifies the token before spending the key.
 */
export const LIVE_PREVIEW_POPULATE_PATH = '/api/live-preview/populate'

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
