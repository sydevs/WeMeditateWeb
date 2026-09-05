/**
 * Live preview page for SahajCloud.
 *
 * Displays a live preview of draft content from SahajCloud (PayloadCMS),
 * with LayoutChrome (full chrome, with Header and Footer).
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
import { PreviewPageData } from './+data'
import { Preview } from '../_components'

export { Page }

function Page() {
  const data = useData<PreviewPageData>()

  return <Preview data={data} />
}
