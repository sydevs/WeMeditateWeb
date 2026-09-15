import { useEffect, useRef, useState } from 'react'

import { mergePreviewData } from '../lib/merge-preview-data'

/**
 * Unsaved edits, streamed from the CMS admin over `postMessage`.
 *
 * ## Why not `useLivePreview` from `@payloadcms/live-preview-react`
 *
 * Two reasons, both structural:
 *
 * - **It cannot reject a message meant for another document.** The hook takes
 *   no `collection`, no `id` and no predicate. `wm-web-config` previews the
 *   site root and its messages carry `globalSlug: 'wm-web-config'`; the hook
 *   would merge the site config into the page and render that.
 * - **Its merge cache is a module-level `let` shared by every subscription**
 *   (`handleMessage.js`), so one wrong-shaped merge poisons the base for every
 *   later one.
 *
 * Its default transport is also a cross-origin `POST` with
 * `credentials: 'include'`, which depends on the editor's Payload cookie
 * surviving as a THIRD-PARTY cookie inside the panel iframe. Safari blocks
 * that outright, and SahajCloud sends `Access-Control-Allow-Origin: *`, which
 * a credentialed request is refused against in every browser — so relationship
 * re-population has never worked here. `mergePreviewData` keeps the
 * server-fetched object whenever the incoming message collapses a populated
 * relation back to the same bare id, which is what that round trip was for.
 *
 * Accepted cost: a relation pointed at a NEWLY created document arrives as a
 * bare id and stays unpopulated until save and reload.
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
  const hasAnnouncedReady = useRef(false)

  // A new document means a new stream; without this, navigating between
  // documents in one session would merge the old one's edits onto the new.
  useEffect(() => {
    setLiveData(null)
  }, [initialData])

  useEffect(() => {
    if (!active || !serverOrigin) return

    const handleMessage = (event: MessageEvent) => {
      // ⚠ Fails CLOSED on an unknown origin. The version this replaced
      // compared against a `'*'` fallback when the CMS URL was unset, so an
      // unset environment variable turned the seek channel into one any page
      // could drive.
      if (event.origin !== serverOrigin) return

      const data = event.data as
        | { type?: unknown; collectionSlug?: unknown; globalSlug?: unknown; data?: unknown }
        | undefined

      if (!data || typeof data !== 'object') return
      if (data.type !== 'payload-live-preview') return

      // The message names what it is about, so a panel editing a different
      // document cannot overwrite this one.
      const messageSlug = data.collectionSlug ?? data.globalSlug

      if (slug && messageSlug && messageSlug !== slug) return

      const incoming = data.data as T | undefined

      if (!incoming) return

      // Belt and braces for the same-collection case: two documents of one
      // collection are still two documents.
      if (initialData?.id && incoming.id && incoming.id !== initialData.id) return

      setLiveData((current) => mergePreviewData(current ?? initialData, incoming))
    }

    window.addEventListener('message', handleMessage)

    // Payload holds the first message until the frame says it is listening.
    if (!hasAnnouncedReady.current) {
      hasAnnouncedReady.current = true
      const parent = window.opener ?? window.parent

      parent?.postMessage({ type: 'payload-live-preview', ready: true }, serverOrigin)
    }

    return () => window.removeEventListener('message', handleMessage)
  }, [active, serverOrigin, slug, initialData])

  return liveData ?? initialData
}

/** The CMS origin messages are accepted from, or `undefined` when unset. */
export function cmsOrigin(): string | undefined {
  const url = import.meta.env.PUBLIC__SAHAJCLOUD_URL

  if (!url) return undefined

  try {
    return new URL(url).origin
  } catch {
    return undefined
  }
}
