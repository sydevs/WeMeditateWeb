/**
 * Live Preview Page for SahajCloud
 *
 * This page displays live preview of draft content from SahajCloud (PayloadCMS)
 * using LayoutChrome (full chrome with Header/Footer).
 *
 * Uses window.postMessage to receive real-time updates as editors make changes.
 *
 * URL Parameters from SahajCloud:
 * - collection: The collection name (e.g., "pages", "meditations")
 * - id: Document ID
 * - locale: Content locale (optional, defaults to 'en')
 */

'use client'

import { useData } from 'vike-react/useData'
import { PreviewPageData } from './+data'
import { Preview } from '../_components'

export { Page }

function Page() {
  const data = useData<PreviewPageData>()

  return <Preview data={data} />
}
