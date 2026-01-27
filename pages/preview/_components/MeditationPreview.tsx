/**
 * Meditation Preview Component
 *
 * Preview component for Meditation content type using PayloadCMS live preview hook.
 * Includes playback time sync to send updates back to SahajCloud admin for frame highlighting.
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Meditation } from './types'
import { MeditationTemplate } from '../../../components/templates'

export interface MeditationPreviewProps {
  initialData: Meditation
}

/**
 * Safely get the origin from PUBLIC__SAHAJCLOUD_URL environment variable.
 * Falls back to '*' if the URL is not configured or invalid.
 */
function getSahajCloudOrigin(): string {
  const url = import.meta.env.PUBLIC__SAHAJCLOUD_URL

  if (!url) {
    console.warn('[MeditationPreview] PUBLIC__SAHAJCLOUD_URL not configured, using "*" as target origin')
    return '*'
  }

  try {
    const origin = new URL(url).origin
    return origin
  } catch (err) {
    // Explicit error variable for compatibility
    console.warn('[MeditationPreview] Invalid PUBLIC__SAHAJCLOUD_URL:', url, 'error:', err)
    return '*'
  }
}

export function MeditationPreview({ initialData }: MeditationPreviewProps) {
  // Get the server URL, defaulting to empty string if not configured
  const serverURL = import.meta.env.PUBLIC__SAHAJCLOUD_URL || ''

  // State for external seek commands from parent window
  // Uses { timestamp, id } so each message triggers a new seek, even to the same timestamp
  const [seekCommand, setSeekCommand] = useState<{ timestamp: number; id: number } | null>(null)

  // Live preview data (meditations only) with no server refetch
  const [liveData, setLiveData] = useState<Meditation>(initialData)
  const hasSentReadyMessage = useRef(false)

  useEffect(() => {
    if (!serverURL) return

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== serverURL) return
      if (!event.data || typeof event.data !== 'object') return
      if (event.data.type !== 'payload-live-preview') return
      if (event.data.collectionSlug && event.data.collectionSlug !== 'meditations') return

      const incoming = event.data.data as Meditation
      if (initialData?.id && incoming?.id && incoming.id !== initialData.id) return

      setLiveData(incoming)
    }

    window.addEventListener('message', handleMessage)

    if (!hasSentReadyMessage.current) {
      hasSentReadyMessage.current = true
      const windowToPostTo = window?.opener || window?.parent
      windowToPostTo?.postMessage(
        {
          type: 'payload-live-preview',
          ready: true,
        },
        serverURL,
      )
    }

    return () => window.removeEventListener('message', handleMessage)
  }, [serverURL, initialData?.id])

  // Listen for postMessage events from SahajCloud admin
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const expectedOrigin = getSahajCloudOrigin()
      const originMatches = expectedOrigin === '*' || event.origin === expectedOrigin

      // Validate origin for security
      if (!originMatches) {
        return
      }

      // Handle SEEK_TO_TIME message
      if (event.data?.type === 'SEEK_TO_TIME' && typeof event.data?.timestamp === 'number') {
        setSeekCommand({ timestamp: event.data.timestamp, id: Date.now() })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const meditation = liveData ?? initialData

  // Send playback time updates to SahajCloud admin for frame highlighting
  const handlePlaybackTimeUpdate = useCallback((currentTime: number) => {
    // Only send messages if we're in an iframe (window.parent exists and differs from window)
    if (window.parent && window.parent !== window) {
      try {
        // Use SahajCloud URL as target origin for security
        const targetOrigin = getSahajCloudOrigin()
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
    <MeditationTemplate
      meditation={meditation}
      onPlaybackTimeUpdate={handlePlaybackTimeUpdate}
      timeDisplay="elapsed"
      seekTo={seekCommand}
    />
  )
}
