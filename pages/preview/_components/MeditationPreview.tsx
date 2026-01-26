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

const summarizePayloadResponse = (value: unknown) => {
  if (Array.isArray(value)) {
    return { type: 'array', length: value.length }
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const errors = Array.isArray(record.errors) ? record.errors.length : 0
    return {
      type: 'object',
      keys: Object.keys(record).slice(0, 20),
      id: record.id,
      _status: record._status,
      hasErrors: errors > 0,
      errorCount: errors,
    }
  }

  return { type: typeof value }
}

const normalizeError = (error: unknown) => {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack }
  }

  return { message: String(error) }
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

  // Log when live preview fetches data from Payload
  useEffect(() => {
    if (!serverURL || typeof window === 'undefined') {
      return
    }

    const originalFetch = window.fetch.bind(window)
    let requestId = 0

    window.fetch = async (input, init) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof Request
          ? input.url
          : ''
      const isPayloadRequest = url.startsWith(serverURL) && url.includes('/api/')

      if (!isPayloadRequest) {
        return originalFetch(input, init)
      }

      const currentId = ++requestId
      const method = init?.method || (input instanceof Request ? input.method : 'GET')
      const bodyPreview = typeof init?.body === 'string' ? init.body.slice(0, 500) : undefined

      console.log('[MeditationPreview] Payload fetch start:', {
        requestId: currentId,
        url,
        method,
        bodyPreview,
      })

      try {
        const response = await originalFetch(input, init)
        const clonedResponse = response.clone()
        const contentType = clonedResponse.headers.get('content-type') || ''

        if (contentType.includes('application/json')) {
          clonedResponse
            .json()
            .then((json) => {
              console.log('[MeditationPreview] Payload fetch response:', {
                requestId: currentId,
                url,
                status: response.status,
                ok: response.ok,
                summary: summarizePayloadResponse(json),
              })
            })
            .catch((error) => {
              console.warn('[MeditationPreview] Payload response JSON parse failed:', {
                requestId: currentId,
                url,
                status: response.status,
                error: normalizeError(error),
              })
            })
        } else {
          clonedResponse
            .text()
            .then((text) => {
              console.log('[MeditationPreview] Payload fetch response:', {
                requestId: currentId,
                url,
                status: response.status,
                ok: response.ok,
                textPreview: text.slice(0, 300),
              })
            })
            .catch((error) => {
              console.warn('[MeditationPreview] Payload response text parse failed:', {
                requestId: currentId,
                url,
                status: response.status,
                error: normalizeError(error),
              })
            })
        }

        return response
      } catch (error) {
        console.error('[MeditationPreview] Payload fetch failed:', {
          requestId: currentId,
          url,
          error: normalizeError(error),
        })
        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [serverURL])

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
