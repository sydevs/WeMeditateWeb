/**
 * Meditation Preview Component
 *
 * Preview component for Meditation content type using PayloadCMS live preview hook.
 * Includes playback time sync to send updates back to SahajCloud admin for frame highlighting.
 */

'use client'

import { useCallback, useEffect } from 'react'
import { useLivePreview } from '@payloadcms/live-preview-react'
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
  console.log('[MeditationPreview] getSahajCloudOrigin called, url:', JSON.stringify(url), 'type:', typeof url)

  if (!url) {
    console.warn('[MeditationPreview] PUBLIC__SAHAJCLOUD_URL not configured, using "*" as target origin')
    return '*'
  }

  try {
    const origin = new URL(url).origin
    console.log('[MeditationPreview] Successfully parsed URL, origin:', origin)
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

  // useLivePreview listens for postMessage events from SahajCloud admin
  const { data: liveData } = useLivePreview<Meditation>({
    initialData,
    serverURL,
    depth: 2,
  })

  const meditation = liveData || initialData

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

  return <MeditationTemplate meditation={meditation} onPlaybackTimeUpdate={handlePlaybackTimeUpdate} timeDisplay="elapsed" />
}
