/**
 * Live Preview Page for SahajCloud
 *
 * This page displays live preview of draft content from SahajCloud (PayloadCMS).
 * It uses window.postMessage to receive real-time updates as editors make changes.
 *
 * Supports multiple content types: pages, meditations, etc.
 *
 * URL Parameters from SahajCloud:
 * - collection: The collection name (e.g., "pages", "meditations")
 * - id: Document ID
 * - locale: Content locale (optional, defaults to 'en')
 */

'use client'

import { useCallback } from 'react'
import { useData } from 'vike-react/useData'
import { useLivePreview } from '@payloadcms/live-preview-react'
import { PreviewPageData } from './+data'
import type { Page as PageData, Meditation as MeditationData } from '../../server/cms-types'
import { PageTemplate, MeditationTemplate } from '../../components/templates'

export { Page }

function Page() {
  const previewData = useData<PreviewPageData>()
  const { collection, locale } = previewData

  // Render appropriate preview based on collection type
  return (
    <>
      {/* Preview Banner */}
      <div className="fixed top-0 left-0 right-0 bg-yellow-400 text-black px-4 py-3 flex justify-between items-center z-50 shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-xl">👁️</span>
          <div>
            <p className="font-bold text-sm">Live Preview Mode</p>
            <p className="text-xs opacity-75">
              Viewing draft {collection} in {locale.toUpperCase()} • Changes update in real-time
            </p>
          </div>
        </div>
      </div>

      {/* Content with top padding to account for fixed banner */}
      <div className="pt-20 min-h-screen">
        {collection === 'pages' && <PagePreview data={previewData} />}
        {collection === 'meditations' && <MeditationPreview data={previewData} />}
      </div>
    </>
  )
}

/**
 * Preview component for Page content type
 */
function PagePreview({ data }: { data: Extract<PreviewPageData, { collection: 'pages' }> }) {
  const { initialData } = data

  // useLivePreview listens for postMessage events from SahajCloud admin
  // and updates the data in real-time as editors make changes
  const { data: liveData } = useLivePreview<PageData>({
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

/**
 * Preview component for Meditation content type
 */
function MeditationPreview({ data }: { data: Extract<PreviewPageData, { collection: 'meditations' }> }) {
  const { initialData } = data

  // useLivePreview listens for postMessage events from SahajCloud admin
  const { data: liveData } = useLivePreview<MeditationData>({
    initialData,
    serverURL: import.meta.env.PUBLIC__SAHAJCLOUD_URL,
    depth: 2,
  })

  const meditation = liveData || initialData

  // Send playback time updates to SahajCloud admin for frame highlighting
  const handlePlaybackTimeUpdate = useCallback((currentTime: number) => {
    // Only send messages if we're in an iframe (window.parent exists and differs from window)
    if (window.parent && window.parent !== window) {
      try {
        // Use SahajCloud URL as target origin for security
        const targetOrigin = new URL(import.meta.env.PUBLIC__SAHAJCLOUD_URL).origin
        window.parent.postMessage({
          type: 'PLAYBACK_TIME_UPDATE',
          currentTime: Math.floor(currentTime),
        }, targetOrigin)
      } catch (error) {
        console.error('[MeditationPreview] Failed to send playback update:', error)
      }
    }
  }, [])

  return (
    <div className="py-12 px-4">
      <MeditationTemplate meditation={meditation} onPlaybackTimeUpdate={handlePlaybackTimeUpdate} />
    </div>
  )
}
