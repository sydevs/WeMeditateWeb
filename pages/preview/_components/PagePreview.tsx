/**
 * Page Preview Component
 *
 * Preview component for Page content type using PayloadCMS live preview hook.
 * Listens for postMessage events from SahajCloud admin and updates in real-time.
 */

'use client'

import { useMemo } from 'react'
import { useLivePreview } from '@payloadcms/live-preview-react'
import type { Page } from './types'
import { PageTemplate } from '../../../components/templates'
import { mergeData } from './mergeData'

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

  // Merge liveData with initialData, preserving initialData values when liveData has undefined
  // This handles cases where mergeData fails (e.g., 403 auth errors) and returns incomplete data
  const pageData = useMemo(
    () => mergeData(initialData, liveData),
    [liveData, initialData]
  )

  return <PageTemplate page={pageData} />
}
