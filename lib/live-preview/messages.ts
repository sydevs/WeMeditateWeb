import { isLivePreviewEvent, ready, unsubscribe } from '@payloadcms/live-preview'
import { useEffect, useState } from 'react'

import { mergePreviewData } from './merge'

/**
 * Unsaved edits, streamed from the CMS admin over `postMessage`.
 *
 * ## What Payload's SDK does here, and what it cannot
 *
 * The protocol is Payload's, so the protocol comes from Payload:
 * `isLivePreviewEvent` owns the origin check and the `payload-live-preview`
 * type tag, `ready` owns the handshake and the `window.opener ?? window.parent`
 * choice between a panel iframe and a popup, and `unsubscribe` owns the
 * teardown. If Payload changes any of those, we follow for free.
 *
 * What is NOT taken is `useLivePreview` / `subscribe`, and the reason is the
 * same in both: neither can be told which document this page is showing.
 *
 * - `useLivePreview` takes `apiRoute`, `depth`, `initialData`, `requestHandler`
 *   and `serverURL` — no `collection`, no `id`, no predicate
 *   (`live-preview-react/dist/useLivePreview.d.ts:35-48`). `handleMessage`
 *   accepts any message carrying either slug and merges it
 *   (`live-preview/dist/handleMessage.js:16-22`). `wm-web-config` previews the
 *   site root and its messages carry `globalSlug: 'wm-web-config'`, so the
 *   site config would be merged into the page and rendered as one.
 * - Its population round trip cannot run here at all. `mergeData` has no local
 *   path: every message goes through `requestHandler(...).then(res => res.json())`
 *   and returns the response (`live-preview/dist/mergeData.js:13-29`), and the
 *   default handler POSTs cross-origin with `credentials: 'include'`
 *   (`mergeData.js:1-12`) while SahajCloud answers `Access-Control-Allow-Origin: *`
 *   with no `Allow-Credentials`. Browsers refuse that pairing, so the fetch
 *   rejects, `handleMessage` rejects, and the callback never fires — an
 *   unhandled rejection per keystroke and no updates at all.
 *
 * `subscribe` with a custom `requestHandler` was tried. It does not pay: the
 * handler is never given `initialData` (`mergeData.js:16-27` passes only the
 * incoming partial), so the base document has to be tracked here anyway; the
 * only identifying value it receives is the `endpoint` STRING, assembled from
 * the previously merged document's id (`mergeData.js:25`), so it cannot tell a
 * sibling document apart either; and returning a merge means wrapping it in a
 * synthetic `Response` for the SDK to `JSON.parse` back. That is the filter and
 * the merge still written here, plus an adapter — strictly more of our own code.
 *
 * ## The cost of not re-populating
 *
 * `mergePreviewData` keeps the server-fetched object whenever an incoming
 * message collapses a populated relation back to the same bare id, which is
 * what the round trip was for. A relation pointed at a NEWLY created document
 * arrives as a bare id and stays unpopulated until save and reload.
 */
export function useLivePreviewMessages<T extends { id?: unknown }>(options: {
  /** The document the server rendered. Returned unchanged until a message lands. */
  initialData: T
  /** Origin messages must come from — the CMS. Anything else is ignored. */
  serverOrigin: string | undefined
  /** Which collection or global this page is showing, if it is showing one. */
  slug?: string
  /** False outside a preview session, where nothing should be listening. */
  active: boolean
}): T {
  const { initialData, serverOrigin, slug, active } = options

  const [liveData, setLiveData] = useState<T | null>(null)

  // A new document means a new stream; without this, navigating between
  // documents in one session would merge the old one's edits onto the new.
  useEffect(() => {
    setLiveData(null)
  }, [initialData])

  useEffect(() => {
    // ⚠ Fails CLOSED on an unset CMS origin: `isLivePreviewEvent` compares
    // `event.origin` for equality, and an earlier version of this compared
    // against a `'*'` fallback instead, which let any page write the page.
    if (!active || !serverOrigin) return

    const onMessage = (event: MessageEvent) => {
      if (!isLivePreviewEvent(event, serverOrigin)) return

      const data = event.data as {
        collectionSlug?: unknown
        globalSlug?: unknown
        data?: unknown
      }

      // The message names what it is about, so a panel editing a different
      // document cannot overwrite this one. This is the part the SDK has no
      // way to express.
      const messageSlug = data.collectionSlug ?? data.globalSlug

      if (slug && messageSlug && messageSlug !== slug) return

      const incoming = data.data as T | undefined

      if (!incoming) return

      // Belt and braces for the same-collection case: two documents of one
      // collection are still two documents.
      if (initialData?.id && incoming.id && incoming.id !== initialData.id) return

      setLiveData((current) => mergePreviewData(current ?? initialData, incoming))
    }

    window.addEventListener('message', onMessage)

    // Payload holds the first message until the frame says it is listening.
    ready({ serverURL: serverOrigin })

    return () => unsubscribe(onMessage)
  }, [active, serverOrigin, slug, initialData])

  return liveData ?? initialData
}
