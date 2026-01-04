/**
 * Meditation Preview Component
 *
 * Preview component for Meditation content type using PayloadCMS live preview hook.
 * Includes playback time sync to send updates back to SahajCloud admin for frame highlighting.
 */

'use client'

import { useCallback } from 'react'
import { useLivePreview } from '@payloadcms/live-preview-react'
import type { Meditation } from './types'
import { MeditationTemplate } from '../../../components/templates'

export interface MeditationPreviewProps {
  initialData: Meditation
}

export function MeditationPreview({ initialData }: MeditationPreviewProps) {
  // useLivePreview listens for postMessage events from SahajCloud admin
  const { data: liveData } = useLivePreview<Meditation>({
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
