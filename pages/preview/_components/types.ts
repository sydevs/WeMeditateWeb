/**
 * Shared types for preview routes
 *
 * This module provides common types used by both /preview and /preview/embed routes.
 *
 * NOTE: This file should NOT import from server modules (cms-client, etc.)
 * to avoid bundling server code in client bundles.
 */

import type {
  Page,
  Meditation,
  Lecture,
  WebConfig,
  MeditationSong,
  RelatedLectureCard,
  RelatedMeditationCard,
} from '../../../server/cms-types'

export type CollectionType = 'pages' | 'meditations' | 'lectures'

/**
 * Base preview data (without settings) - used by embed route.
 *
 * Note: lectures carry the raw `Lecture` (not a normalized ResolvedLecture);
 * LecturePreview normalizes it client-side after each live-preview update.
 */
export type BasePreviewData =
  | {
      collection: 'pages'
      initialData: Page
      locale: string
    }
  | {
      collection: 'meditations'
      initialData: Meditation
      musicTracks: MeditationSong[]
      locale: string
      /** Related lectures, rendered below the player on the chromed full preview.
       * Omitted on the bare embed preview (mirrors the embed route). */
      relatedLectures?: RelatedLectureCard[]
    }
  | {
      collection: 'lectures'
      initialData: Lecture
      locale: string
      /** Related meditations, rendered below the player on the chromed full
       * preview. Omitted on the bare embed preview. */
      relatedMeditations?: RelatedMeditationCard[]
    }

/**
 * Full preview data with settings - used by the chromed /preview route (LayoutChrome)
 */
export type FullPreviewData =
  | {
      collection: 'pages'
      initialData: Page
      locale: string
      settings: WebConfig
    }
  | {
      collection: 'meditations'
      initialData: Meditation
      musicTracks: MeditationSong[]
      locale: string
      settings: WebConfig
      /** Related lectures, rendered below the player in the full preview. */
      relatedLectures?: RelatedLectureCard[]
    }
  | {
      collection: 'lectures'
      initialData: Lecture
      locale: string
      settings: WebConfig
      /** Related meditations, rendered below the player in the full preview. */
      relatedMeditations?: RelatedMeditationCard[]
    }

// Re-export types for convenience
export type {
  Page,
  Meditation,
  Lecture,
  WebConfig,
  MeditationSong,
  RelatedLectureCard,
  RelatedMeditationCard,
}
