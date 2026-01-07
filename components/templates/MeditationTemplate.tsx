/**
 * MeditationTemplate - Template for rendering meditation content
 *
 * This template is used by both regular meditation pages and preview pages to ensure
 * consistent meditation rendering. Following Atomic Design, templates represent
 * page layout structures.
 *
 * This template wraps the MeditationPlayer organism and handles:
 * - Frame JSON parsing with error handling
 * - Fallback to thumbnail when frames unavailable
 * - Validation of required fields (audio URL)
 *
 * @example
 * <MeditationTemplate meditation={meditationData} />
 */

import type { Meditation, Image } from '../../server/cms-types'
import { MeditationPlayer, type MeditationFrame } from '../organisms/MeditationPlayer'

/**
 * Type guard to check if a relationship field is a populated object (not just an ID)
 */
function isPopulatedImage(value: number | Image | null | undefined): value is Image {
  return typeof value === 'object' && value !== null && 'url' in value
}

/**
 * Safely get URL from an image relationship field that may be populated or just an ID
 */
function getImageUrl(image: number | Image | null | undefined): string | undefined {
  return isPopulatedImage(image) ? image.url ?? undefined : undefined
}

export interface MeditationTemplateProps {
  /**
   * Meditation data from SahajCloud (PayloadCMS)
   */
  meditation: Meditation
  /**
   * Optional callback fired every 100ms during playback with current time in seconds
   * Also fired on play, pause, and seek events
   */
  onPlaybackTimeUpdate?: (currentTime: number) => void
  /**
   * How to display time in the player: 'countdown' shows remaining time, 'elapsed' shows current position
   * @default 'countdown'
   */
  timeDisplay?: 'countdown' | 'elapsed'
  /**
   * External seek command - when set to a timestamp (in seconds), the player will seek to that position.
   * Set to null after seeking is complete via onSeekComplete callback.
   */
  seekTo?: number | null
  /**
   * Callback fired after an external seek command has been executed.
   * Use this to reset seekTo to null.
   */
  onSeekComplete?: () => void
}

export function MeditationTemplate({ meditation, onPlaybackTimeUpdate, timeDisplay, seekTo, onSeekComplete }: MeditationTemplateProps) {
  // Get CMS base URL for building full frame URLs
  const cmsBaseUrl = import.meta.env.PUBLIC__SAHAJCLOUD_URL || ''

  // Parse and transform frames from CMS format to MeditationPlayer format
  let frames: MeditationFrame[] = []
  if (meditation.frames) {
    try {
      const rawFrames =
        typeof meditation.frames === 'string'
          ? JSON.parse(meditation.frames)
          : Array.isArray(meditation.frames)
            ? meditation.frames
            : []

      // Transform CMS frames to MeditationPlayer format
      frames = rawFrames
        .filter((frame: { url?: string | null }) => frame.url)
        .map((frame: { timestamp?: number; url: string; mimeType?: string | null }) => ({
          timestamp: frame.timestamp ?? 0,
          media: {
            type: frame.mimeType?.startsWith('video/') ? 'video' : 'image',
            src: frame.url.startsWith('http') ? frame.url : `${cmsBaseUrl}${frame.url}`,
          },
        }))
    } catch (error) {
      console.error('Failed to parse meditation frames:', error)
    }
  }

  // Fallback: use thumbnail as single frame if no frames available
  if (frames.length === 0) {
    const thumbnailUrl = getImageUrl(meditation.thumbnail)
    if (thumbnailUrl) {
      frames = [
        {
          timestamp: 0,
          media: {
            type: 'image',
            src: thumbnailUrl,
          },
        },
      ]
    }
  }

  // Validate required fields
  if (!meditation.url) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
          <p className="text-red-700">This meditation is missing a required audio URL.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto h-full">
      {/* Meditation Player */}
      <MeditationPlayer
        track={{
          url: meditation.url,
          title: meditation.title || 'Untitled Meditation',
          credit: '',
          creditURL: '',
          thumbnailURL: getImageUrl(meditation.thumbnail) || '',
          duration: 0, // Duration will be detected by audio player
        }}
        title={meditation.title || 'Untitled Meditation'}
        frames={frames}
        onPlaybackTimeUpdate={onPlaybackTimeUpdate}
        timeDisplay={timeDisplay}
        seekTo={seekTo}
        onSeekComplete={onSeekComplete}
      />
    </div>
  )
}
