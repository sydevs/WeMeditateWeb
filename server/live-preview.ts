import { jwtVerify } from 'jose'
import type { PageContextServer } from 'vike/types'

import { perRequest } from './request-memo'
import {
  LIVE_PREVIEW_INACTIVE,
  LIVE_PREVIEW_PARAM,
  LIVE_PREVIEW_SCOPE_PARAM,
  readLivePreviewScope,
  type LivePreviewScope,
  type LivePreviewState,
} from '../lib/live-preview/protocol'

/**
 * Live preview: reading and verifying the credential on a preview URL.
 *
 * ## The shape
 *
 * Any route, with a valid token, renders drafts:
 *
 *     /<any path>?live-preview=<token>[&scope=<slug>]
 *
 * There are no preview-specific routes. SahajCloud points its Live Preview panel
 * at the real page, so what an editor sees is the page, not a second renderer
 * kept approximately equal to it.
 *
 * ## Why a token and not the shared secret
 *
 * The credential rides in a URL, and `location.href` is read by in-page
 * third-party JavaScript — Sentry's session replay, and the analytics script
 * in `pages/+Head.tsx`, which posts it with every pageview. `Referrer-Policy`
 * governs what the browser sends, not what a script reads, so it reaches
 * neither. The browser-side answer is in `lib/live-preview/token-url.ts`.
 *
 * So SahajCloud signs a short-lived Ed25519 token and this site verifies it with a
 * **public** key. The key is committed, not a secret: a verification key being
 * published costs nothing, and there is no second copy of a secret to keep in
 * sync with SahajCloud.
 *
 * ⚠ **A leaked token grants nothing on its own.** SahajCloud's
 * `createAccessConfig` runs `hasPermission` first, and lifts its published-only
 * clause only for a request already authenticated as a `clients` user. What
 * would be worth something is a leaked token combined with an API key, and the
 * atlas ships a browser-usable one. That is what bounds the risk, and what
 * makes a 45–90 minute verify-only token the right size of credential.
 *
 * ⚠ **Verification is the whole gate.** A forged or expired `?live-preview=`
 * opens no session, so an invalid value renders the published page with a
 * `200`, indistinguishable from an ordinary request. Nothing tells a caller
 * whether they guessed correctly.
 *
 * ## The other half
 *
 * The browser's side of live preview is `lib/live-preview/`, and the two meet
 * at `lib/live-preview/protocol.ts`, which both import. Nothing in this file
 * may be imported from there: it reads the token.
 */

/**
 * The verdict plus the credential, for server-side fetchers.
 *
 * Returned only by {@link loadLivePreview}, which is server-only by virtue of
 * living under `server/` and being called from `data()` and `+onBeforeRender`.
 * `toClientState` is the one way this becomes something `passToClient` carries.
 */
export interface LivePreviewSession extends LivePreviewState {
  /** The verified token, to forward to SahajCloud. Never leaves the server. */
  token: string | null
}

export const LIVE_PREVIEW_OFF: LivePreviewSession = { ...LIVE_PREVIEW_INACTIVE, token: null }

/** Strips the credential, leaving what the browser may see. */
export function toClientState(session: LivePreviewSession): LivePreviewState {
  return { active: session.active, scope: session.scope }
}

/**
 * The `preview` / `previewToken` pair for one SahajCloud read.
 *
 * Three `data()` functions and the translations read each spelled this out,
 * and the condition has a meaning that the spelling does not show: **a read
 * asks for drafts only when the panel is editing the thing being read.** A
 * page preview must not hand drafts to the translations read, and a
 * translations preview must leave the page itself published — otherwise a
 * translator checking their strings would see them on someone's unsaved draft.
 *
 * The token goes only where `preview` is true. `createPayloadClient` already
 * drops it otherwise (`server/payload-client.ts`), so this changes nothing at
 * the wire; it means a reader does not have to go and check that it does.
 *
 * @param scope - what this read is fetching. The default, `null`, is the
 *   route's own primary document.
 */
export function previewArgs(
  session: LivePreviewSession,
  scope: LivePreviewScope | null = null,
): { preview: boolean; previewToken: string | undefined } {
  const preview = session.active && session.scope === scope

  return { preview, previewToken: preview ? (session.token ?? undefined) : undefined }
}

/**
 * Verifies a token minted by SahajCloud.
 *
 * The token is a standard EdDSA compact JWS carrying only `exp`. `jose` does
 * the parsing, the signature and the expiry; pinning `algorithms` is what
 * stops a token that nominates its own weaker algorithm.
 *
 * `server/live-preview.test.ts` mints with the same construction SahajCloud uses,
 * so a format drift breaks a test here rather than live preview in production.
 *
 * Returns false for every failure and never reports which — a caller learning
 * WHY its token was refused learns how to forge a better one.
 */
export async function verifyLivePreviewToken(
  token: string,
  verifyKeyBase64: string | undefined,
  nowSeconds?: number,
): Promise<boolean> {
  if (!verifyKeyBase64) return false

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      Buffer.from(verifyKeyBase64.replace(/\s/g, ''), 'base64') as unknown as BufferSource,
      'Ed25519',
      false,
      ['verify'],
    )

    await jwtVerify(token, key, {
      algorithms: ['EdDSA'],
      // `jose` reads the clock itself; the parameter exists so a spec can pin
      // a moment rather than racing a real one.
      ...(nowSeconds === undefined ? {} : { currentDate: new Date(nowSeconds * 1000) }),
    })

    return true
  } catch {
    return false
  }
}

/**
 * The live-preview verdict for this request, computed once.
 *
 * Verification is a signature check, so it is cheap — but several `data()`
 * functions plus `onBeforeRender` all ask, and they must agree. A second call
 * that disagreed would render a draft body inside published chrome, or the
 * reverse, with nothing to show for it.
 *
 * ⚠ **Not `+onBeforeRoute`**, which is where `locale` is derived: that hook is
 * synchronous and runs on the client during client-side routing, and this check
 * is async. `data()` runs before `onBeforeRender`, so the verdict cannot be set
 * there either — hence a memo both can call.
 */
const cache = new WeakMap<object, Promise<LivePreviewSession>>()

export function loadLivePreview(pageContext: PageContextServer): Promise<LivePreviewSession> {
  return perRequest(cache, pageContext, () =>
    readLivePreviewState(pageContext).catch(() => LIVE_PREVIEW_OFF),
  )
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
