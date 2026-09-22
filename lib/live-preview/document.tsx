import type { CollectionPopulationRequestHandler } from '@payloadcms/live-preview'
import { useLivePreview } from '@payloadcms/live-preview-react'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'

import { LIVE_PREVIEW_POPULATE_PATH, LIVE_PREVIEW_TOKEN_HEADER } from './protocol'
import { sahajCloudOrigin, useDocumentPreviewActive } from './session'
import { livePreviewToken } from './token-url'

/**
 * Unsaved edits, streamed from the SahajCloud admin over `postMessage`.
 *
 * ## The transport is Payload's
 *
 * `useLivePreview` owns the listener, the `payload-live-preview` type tag, the
 * origin check, the `ready()` handshake, the `window.opener ?? window.parent`
 * choice between a panel iframe and a popup, and the teardown. If Payload
 * changes any of that, we follow for free. What is written here is only what
 * the hook has no way to be told.
 *
 * ## What the hook cannot be told, and why it does not matter
 *
 * `useLivePreview` takes no `collection` and no `id`, so it merges any message
 * carrying either slug. Three mechanisms already leave exactly one subscriber,
 * for the document the URL names:
 *
 * 1. **`useDocumentPreviewActive()`**, below — true only for an unscoped
 *    session. SahajCloud emits `scope=wm-web-config` / `scope=wm-web-translations`
 *    when the panel is editing a global, so a globals preview mounts no
 *    document subscriber at all.
 * 2. **Two call sites**, on routes that cannot both render.
 * 3. **`useLivePreviewLinkGuard`** (`./navigation.ts`) inerts every anchor but
 *    `#hash`, so the iframe cannot navigate and `initialData` is fixed for the
 *    session.
 *
 * The one filter that is written here rather than assumed is
 * {@link createPopulateRequestHandler}'s endpoint check, which costs nothing
 * because the handler has to exist anyway.
 *
 * ## Why the handler has to exist
 *
 * `mergeData`'s default handler POSTs to SahajCloud with `credentials: 'include'`
 * while SahajCloud answers `Access-Control-Allow-Origin: *` with no
 * `Allow-Credentials`. Browsers refuse that pairing, which is why relationship
 * population never worked here. `requestHandler` is an explicit override
 * point, so the request goes same-origin to `/api/live-preview/populate`
 * instead, and the SahajCloud round trip happens on the server, where the API key is.
 *
 * ## What that round trip buys
 *
 * A relationship pointed at a **newly created** document used to arrive as a
 * bare id and stay unpopulated until save and reload. It no longer does: the
 * SahajCloud populates the unsaved document and answers with the real objects
 * (verified against production).
 */

/**
 * The collection, or `globals/<slug>`, that an endpoint string names.
 *
 * `mergeData` builds `endpoint` as `<the message's collectionSlug>/<our
 * initialData.id>`, or `globals/<the message's globalSlug>`. So the first
 * segment is the only part of it the message chose.
 */
export function endpointSlug(endpoint: string): string | null {
  const [first, second] = endpoint.split('/')

  if (first === 'globals') return second ? `globals/${second}` : null

  return first || null
}

/**
 * The populate round trip, as `mergeData` calls it.
 *
 * Three things the SDK leaves to a handler:
 *
 * - **the document filter.** `endpoint` is the only identifying value a
 *   handler is given, and its first segment is the message's own slug. A
 *   message about another collection is refused here — this is what replaces
 *   the hand-written message filter that used to live in `./messages.ts`.
 * - **error handling.** `mergeData` has no try/catch and no status check: a
 *   rejection kills the callback silently, and a non-2xx JSON error body is
 *   returned as if it were the document, so `{errors:[…]}` renders as a page.
 *   Every failure below answers with the last good document instead, which is
 *   what stays on screen.
 * - **the credential.** The proxy re-verifies this token before it spends the
 *   server's API key, so sending a stale one costs a 403, not a leak.
 *
 * The answer is re-serialised rather than passed through, because `mergeData`
 * calls `.json()` on it outside any try/catch of ours: a malformed body has to
 * fail here, where it can fall back, not there, where it cannot.
 */
export function createPopulateRequestHandler<T extends { id?: unknown }>(options: {
  /** The collection this page shows. A message about another is refused. */
  slug: string
  /** The session's token, read at call time. `null` off-preview. */
  token: () => string | null
  /** The document on screen, returned unchanged whenever the populate fails. */
  lastGood: () => T
}): CollectionPopulationRequestHandler {
  const { slug, token, lastGood } = options

  return async ({ data, endpoint }) => {
    const previous = lastGood()
    const keepCurrent = () => new Response(JSON.stringify(previous))
    const credential = token()

    if (endpointSlug(endpoint) !== slug) return keepCurrent()

    // Belt and braces for the same-collection case, which the endpoint cannot
    // show: two documents of one collection are still two documents, and
    // `mergeData` composes the endpoint from OUR id whatever the message says.
    const incoming = (data as { data?: { id?: unknown } }).data

    if (incoming?.id && previous?.id && String(incoming.id) !== String(previous.id)) {
      return keepCurrent()
    }

    if (!credential) return keepCurrent()

    try {
      const response = await fetch(
        `${LIVE_PREVIEW_POPULATE_PATH}?endpoint=${encodeURIComponent(endpoint)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [LIVE_PREVIEW_TOKEN_HEADER]: credential,
          },
          body: JSON.stringify(data),
        },
      )

      if (!response.ok) return keepCurrent()

      const populated: unknown = await response.json()

      if (!populated || typeof populated !== 'object' || Array.isArray(populated)) {
        return keepCurrent()
      }

      return new Response(JSON.stringify(populated))
    } catch {
      return keepCurrent()
    }
  }
}

/**
 * What a previewable document has to be, which is barely anything.
 *
 * `any` rather than `unknown`, following the SDK's own constraint: a generated
 * PayloadCMS interface has no index signature, so it does not satisfy
 * `Record<string, unknown>` and `Page` could not be passed at all.
 */
type PreviewDocument = Record<string, any>

interface DocumentProps<T> {
  /** Rendered with the live document, or with `initialData` off-preview. */
  children: (document: T) => ReactNode
  /** The document the server rendered. */
  initialData: T
  /** Which collection this page is showing. */
  slug: string
}

/**
 * Renders `children` with the document, live while the panel is editing it.
 *
 * ⚠ **The subscriber mounts only for an unscoped session with a known SahajCloud
 * origin.** Both halves fail CLOSED, and neither is a detail of this file:
 * mounting it unconditionally would attach a listener and fire the `ready()`
 * handshake on every ordinary page view, and an unset `PUBLIC__SAHAJCLOUD_URL`
 * would leave `isLivePreviewEvent` comparing `event.origin` against
 * `undefined` while `ready()` posted to it. A React hook cannot be
 * conditional, so the condition is a component boundary instead.
 */
export function LivePreviewDocument<T extends PreviewDocument>({
  children,
  initialData,
  slug,
}: DocumentProps<T>): ReactNode {
  const previewingThisDocument = useDocumentPreviewActive()
  const serverURL = sahajCloudOrigin()

  if (!previewingThisDocument || !serverURL) return children(initialData)

  return (
    <SubscribedDocument initialData={initialData} serverURL={serverURL} slug={slug}>
      {children}
    </SubscribedDocument>
  )
}

/** The half that subscribes. Mounted only under an open session. */
function SubscribedDocument<T extends PreviewDocument>({
  children,
  initialData,
  serverURL,
  slug,
}: DocumentProps<T> & { serverURL: string }): ReactNode {
  // The document on screen, for a failed populate to fall back to. A ref
  // rather than state: it is read inside the handler, never rendered.
  const lastGood = useRef(initialData)

  // Memoised because the hook re-subscribes on every change of it, and a
  // re-subscribe resets the SDK's accumulated document.
  const requestHandler = useMemo(
    () =>
      createPopulateRequestHandler<T>({
        slug,
        token: livePreviewToken,
        lastGood: () => lastGood.current,
      }),
    [slug],
  )

  // No `depth`: the server decides it, from the same read shape that rendered
  // this page (`documentReadArgs` in `server/sahajcloud-client.ts`).
  const { data } = useLivePreview<T>({ initialData, requestHandler, serverURL })

  useEffect(() => {
    lastGood.current = data
  }, [data])

  return children(data)
}
