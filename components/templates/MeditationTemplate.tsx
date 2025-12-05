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

import { Meditation } from '../../server/graphql-types'
import { MeditationPlayer, type MeditationFrame } from '../organisms/MeditationPlayer'

export interface MeditationTemplateProps {
  /**
   * Meditation data from PayloadCMS
   */
  meditation: Meditation
}

export function MeditationTemplate({ meditation }: MeditationTemplateProps) {
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
      if (meditation.thumbnail?.url) {
        frames = [
          {
            timestamp: 0,
            media: {
              type: 'image',
              src: meditation.thumbnail.url,
            },
          },
        ]
      }
    }
  } else if (meditation.thumbnail?.url) {
    // No frames provided, use thumbnail as fallback
    frames = [
      {
        timestamp: 0,
        media: {
          type: 'image',
          src: meditation.thumbnail.url,
        },
      },
    ]
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
          thumbnailURL: meditation.thumbnail?.url || '',
          duration: 0, // Duration will be detected by audio player
        }}
        title={meditation.title || 'Untitled Meditation'}
        subtitle={meditation.label || undefined}
        frames={frames}
      />
    </div>
  )
}
