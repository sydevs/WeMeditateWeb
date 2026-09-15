import type { PageContextServer } from 'vike/types'

/**
 * Live preview: reading and verifying the credential on a preview URL.
 *
 * ## The shape
 *
 * Any route, with a valid token, renders drafts:
 *
 *     /<any path>?live-preview=<token>[&scope=<slug>]
 *
 * There are no preview-specific routes. The CMS points its Live Preview panel
 * at the real page, so what an editor sees is the page, not a second renderer
 * kept approximately equal to it.
 *
 * ## Why a token and not the shared secret
 *
 * The credential rides in a URL, and a URL is read by browser history, the
 * `Referer` header, Sentry's session replay, and the analytics script in
 * `pages/+Head.tsx`, which posts `location.href`. Neither `Referrer-Policy`
 * nor a Sentry `beforeSend` stops that last one.
 *
 * So the CMS signs a short-lived Ed25519 token and this site verifies it with a
 * **public** key. The key is committed, not a secret: a verification key being
 * published costs nothing, and there is no second copy of a secret to keep in
 * sync with SahajCloud.
 *
 * ⚠ **Verification is the whole gate.** A forged or expired `?live-preview=`
 * opens no session, so an invalid value renders the published page with a
 * `200`, indistinguishable from an ordinary request. Nothing tells a caller
 * whether they guessed correctly.
 */

/** The query parameter carrying the token. Matches SahajAtlasWeb's spelling. */
export const LIVE_PREVIEW_PARAM = 'live-preview'

/** The query parameter naming what the admin panel is editing. */
export const LIVE_PREVIEW_SCOPE_PARAM = 'scope'

/**
 * The API-client role this site's key holds.
 *
 * A token names the role that may redeem it, and SahajCloud checks that claim
 * against the roles on the authenticated key. Checking it here too means a
 * token minted for the atlas never even opens a session on this site.
 *
 * ⚠ The claim used to name the *site* (`wm-web`). Only the consumers checked
 * that, each against a constant it hardcoded, while the CMS accepted either —
 * so one leaked token unlocked drafts on both surfaces. A role is matched
 * against something the request proves.
 */
const CLIENT_ROLE = 'wemeditate-web-client'

/**
 * What the panel is editing, when it is not the route's own document.
 *
 * A closed set: an unrecognised value falls back to the default rather than
 * widening what reads drafts. Every value here is emitted by exactly one
 * `livePreview.url` in SahajCloud.
 */
export type LivePreviewScope = 'wm-web-translations' | 'wm-web-config'

const SCOPES: ReadonlySet<string> = new Set(['wm-web-translations', 'wm-web-config'])

/**
 * The verdict for one request, as the BROWSER sees it.
 *
 * ⚠ **This shape is in `passToClient`, so everything on it is public.** The
 * token is deliberately absent: the client needs to know it is in a preview so
 * the link guard mounts and the message listener subscribes, and it must never
 * learn the credential that unlocked it.
 */
export interface LivePreviewState {
  active: boolean
  /** `null` means the route's own primary document reads drafts. */
  scope: LivePreviewScope | null
}

/**
 * The same verdict plus the credential, for server-side fetchers.
 *
 * Returned only by {@link loadLivePreview}, which is server-only by virtue of
 * living under `server/` and being called from `data()` and `+onBeforeRender`.
 * `toClientState` is the one way this becomes something `passToClient` carries.
 */
export interface LivePreviewSession extends LivePreviewState {
  /** The verified token, to forward to the CMS. Never leaves the server. */
  token: string | null
}

export const LIVE_PREVIEW_OFF: LivePreviewSession = { active: false, scope: null, token: null }

/** Strips the credential, leaving what the browser may see. */
export function toClientState(session: LivePreviewSession): LivePreviewState {
  return { active: session.active, scope: session.scope }
}

function base64UrlDecode(value: string): Uint8Array | null {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')

  try {
    const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='))

    return Uint8Array.from(binary, (char) => char.charCodeAt(0))
  } catch {
    return null
  }
}

/**
 * Verifies a token minted by SahajCloud's `mintLivePreviewToken`.
 *
 * Deliberately a copy of that check rather than a shared import — this repo
 * does not depend on the CMS's source. SahajCloud's
 * `tests/unit/live-preview-token.spec.ts` is the reference for the format;
 * `server/live-preview.test.ts` here pins the same cases against a locally
 * minted token, so a drift breaks a test rather than live preview.
 *
 * Returns false for every failure and never reports which.
 */
export async function verifyLivePreviewToken(
  token: string,
  verifyKeyBase64: string | undefined,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  if (!verifyKeyBase64) return false

  const [body, signature] = token.split('.')

  if (!body || !signature) return false

  const keyBytes = base64UrlDecode(verifyKeyBase64.replace(/\s/g, ''))
  const signatureBytes = base64UrlDecode(signature)
  const claimsBytes = base64UrlDecode(body)

  if (!keyBytes || !signatureBytes || !claimsBytes) return false

  let key: CryptoKey

  try {
    key = await crypto.subtle.importKey('raw', keyBytes as BufferSource, 'Ed25519', false, [
      'verify',
    ])
  } catch {
    return false
  }

  const valid = await crypto.subtle.verify(
    'Ed25519',
    key,
    signatureBytes as BufferSource,
    new TextEncoder().encode(body) as BufferSource,
  )

  if (!valid) return false

  // Parsed only after the signature holds, so nothing downstream ever reads
  // unauthenticated JSON.
  let claims: { role?: unknown; exp?: unknown }

  try {
    claims = JSON.parse(new TextDecoder().decode(claimsBytes)) as typeof claims
  } catch {
    return false
  }

  if (claims.role !== CLIENT_ROLE) return false
  if (typeof claims.exp !== 'number' || claims.exp <= nowSeconds) return false

  return true
}

/** Narrows a raw `scope` parameter to the closed set, or `null`. */
export function readLivePreviewScope(raw: string | undefined): LivePreviewScope | null {
  return raw && SCOPES.has(raw) ? (raw as LivePreviewScope) : null
}

/**
 * The live-preview verdict for this request, computed once.
 *
 * Memoised on the `pageContext` object, the same way `site-context.ts` memoises
 * its global reads. Verification is a signature check, so it is cheap — but
 * several `data()` functions plus `onBeforeRender` all ask, and they must agree.
 * A second call that disagreed would render a draft body inside published
 * chrome, or the reverse, with nothing to show for it.
 *
 * Vike builds a fresh `pageContext` per request, so entries cannot leak between
 * requests and the map needs no clearing.
 *
 * ⚠ **Not `+onBeforeRoute`**, which is where `locale` is derived: that hook is
 * synchronous and runs on the client during client-side routing, and this check
 * is async. `data()` runs before `onBeforeRender`, so the verdict cannot be set
 * there either — hence a memo both can call.
 */
const cache = new WeakMap<object, Promise<LivePreviewSession>>()

export function loadLivePreview(pageContext: PageContextServer): Promise<LivePreviewSession> {
  const existing = cache.get(pageContext)

  if (existing) return existing

  const loading = readLivePreviewState(pageContext).catch(() => LIVE_PREVIEW_OFF)

  cache.set(pageContext, loading)

  return loading
}

/**
 * The live-preview verdict for this request.
 *
 * Never throws: a preview that cannot be verified is simply not a preview, and
 * the page renders published content as it would for anyone else.
 */
export async function readLivePreviewState(
  pageContext: PageContextServer,
): Promise<LivePreviewSession> {
  const search = pageContext.urlParsed?.search as Record<string, string | undefined> | undefined
  const token = search?.[LIVE_PREVIEW_PARAM]

  if (!token) return LIVE_PREVIEW_OFF

  const verified = await verifyLivePreviewToken(
    token,
    import.meta.env.PUBLIC__LIVE_PREVIEW_VERIFY_KEY,
  )

  if (!verified) return LIVE_PREVIEW_OFF

  return {
    active: true,
    scope: readLivePreviewScope(search?.[LIVE_PREVIEW_SCOPE_PARAM]),
    token,
  }
}
