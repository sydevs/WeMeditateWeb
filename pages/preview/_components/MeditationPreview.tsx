/**
 * Meditation Preview Component
 *
 * Preview component for Meditation content type using PayloadCMS live preview hook.
 * Includes playback time sync to send updates back to SahajCloud admin for frame highlighting.
 */

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLivePreview } from '@payloadcms/live-preview-react'
import type { Meditation } from './types'
import { MeditationTemplate } from '../../../components/templates'
import { mergeData } from './mergeData'

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

  // Log component mount configuration for debugging
  useEffect(() => {
    console.log('[MeditationPreview] Component mounted with config:', {
      serverURL,
      initialDataId: initialData.id,
      initialDataTitle: initialData.title,
      isInIframe: window.parent !== window,
      expectedOrigin: getSahajCloudOrigin(),
    })
  }, [serverURL, initialData.id, initialData.title])

  // useLivePreview listens for postMessage events from SahajCloud admin
  const { data: liveData } = useLivePreview<Meditation>({
    initialData,
    serverURL,
    depth: 2,
  })

  // Log when liveData changes to track live preview updates
  useEffect(() => {
    console.log('[MeditationPreview] liveData updated:', {
      id: liveData?.id,
      title: liveData?.title,
      hasUrl: !!liveData?.url,
      hasFrames: !!liveData?.frames,
      framesType: typeof liveData?.frames,
      isInitialData: liveData === initialData,
      liveDataRef: liveData ? 'has data' : 'null/undefined',
    })
  }, [liveData, initialData])

  // Listen for postMessage events from SahajCloud admin
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Log ALL incoming postMessage events for debugging live preview
      const expectedOrigin = getSahajCloudOrigin()
      const originMatches = expectedOrigin === '*' || event.origin === expectedOrigin

      // Log all messages that look like they might be from PayloadCMS
      if (event.data && typeof event.data === 'object') {
        console.log('[MeditationPreview] postMessage received:', {
          type: event.data?.type,
          origin: event.origin,
          expectedOrigin,
          originMatches,
          dataKeys: Object.keys(event.data),
          // Log data snapshot for live preview messages
          ...(event.data?.type?.includes('payload') || event.data?.type?.includes('live')
            ? { dataPreview: JSON.stringify(event.data).slice(0, 500) }
            : {}),
        })
      }

      // Validate origin for security
      if (!originMatches) {
        return
      }

      // Handle SEEK_TO_TIME message
      if (event.data?.type === 'SEEK_TO_TIME' && typeof event.data?.timestamp === 'number') {
        console.log('[MeditationPreview] Received SEEK_TO_TIME:', event.data.timestamp)
        setSeekCommand({ timestamp: event.data.timestamp, id: Date.now() })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Merge liveData with initialData, preserving initialData values when liveData has undefined
  // This handles the 403 error case where mergeData fails and returns incomplete data
  const meditation = useMemo(
    () => mergeData(initialData, liveData),
    [liveData, initialData]
  )

  // Debug logging for meditation state and frames
  useEffect(() => {
    // Parse frames - can be JSON string or array
    let parsedFrames: Array<{ startTime?: number; timestamp?: number; media?: unknown }> = []
    if (meditation.frames) {
      try {
        parsedFrames =
          typeof meditation.frames === 'string'
            ? JSON.parse(meditation.frames)
            : Array.isArray(meditation.frames)
              ? meditation.frames
              : []
      } catch {
        // Ignore parse errors for debug logging
      }
    }

    console.log('[MeditationPreview] State:', {
      id: meditation.id,
      title: meditation.title,
      framesRaw: meditation.frames,
      framesType: typeof meditation.frames,
      frames: parsedFrames.map((f, i) => ({
        index: i,
        startTime: f.startTime ?? f.timestamp,
        hasMedia: !!f.media,
      })),
      totalFrames: parsedFrames.length,
    })
  }, [meditation])

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
