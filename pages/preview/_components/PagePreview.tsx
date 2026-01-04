/**
 * Page Preview Component
 *
 * Preview component for Page content type using PayloadCMS live preview hook.
 * Listens for postMessage events from SahajCloud admin and updates in real-time.
 */

'use client'

import { useLivePreview } from '@payloadcms/live-preview-react'
import type { Page } from './types'
import { PageTemplate } from '../../../components/templates'

export interface PagePreviewProps {
  initialData: Page
}

export function PagePreview({ initialData }: PagePreviewProps) {
  // useLivePreview listens for postMessage events from SahajCloud admin
  // and updates the data in real-time as editors make changes
  const { data: liveData } = useLivePreview<Page>({
    initialData,
    serverURL: import.meta.env.PUBLIC__SAHAJCLOUD_URL,
    depth: 2, // Populate relationships and uploads to 2 levels deep
  })

  const pageData = liveData || initialData

  return (
    <div className="py-12 px-4">
      <PageTemplate page={pageData} />
    </div>
  )
}
