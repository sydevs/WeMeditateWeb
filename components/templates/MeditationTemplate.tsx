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
}

export function MeditationTemplate({ meditation, onPlaybackTimeUpdate }: MeditationTemplateProps) {
  // Parse frames JSON with error handling
  let frames: MeditationFrame[] = []
  if (meditation.frames) {
    try {
      frames =
        typeof meditation.frames === 'string'
          ? JSON.parse(meditation.frames)
          : meditation.frames
    } catch (error) {
      console.error('Failed to parse meditation frames:', error)
      // Fallback: use thumbnail as single frame if available
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
  } else {
    // No frames provided, use thumbnail as fallback
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
    <div className="max-w-6xl mx-auto">
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
        subtitle={meditation.label || undefined}
        frames={frames}
        onPlaybackTimeUpdate={onPlaybackTimeUpdate}
      />
    </div>
  )
}
