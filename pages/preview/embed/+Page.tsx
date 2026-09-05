/**
 * Embed live preview page for SahajCloud.
 *
 * Displays a live preview of draft content with no site chrome. It sets
 * no Layout, so it inherits only the global LayoutRoot (no Header or
 * Footer). This previews how an embedded player will look.
 *
 * Uses window.postMessage to receive real-time updates as editors make
 * changes.
 *
 * URL parameters from SahajCloud:
 * - collection: the collection name (for example, "pages", "meditations")
 * - id: document ID
 * - locale: content locale (optional, defaults to 'en')
 */

'use client'

import { useData } from 'vike-react/useData'
import { EmbedPreviewPageData } from './+data'
import { Preview } from '../_components'

export { Page }

function Page() {
  const data = useData<EmbedPreviewPageData>()

  return (
    <Preview
      data={data}
      // Embed preview already renders inside an iframe — no embed-in-embed.
      showEmbedButton={false}
    />
  )
}
