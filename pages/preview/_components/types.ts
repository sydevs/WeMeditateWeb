/**
 * Shared types for preview routes.
 *
 * This module provides common types for both /preview and /preview/embed
 * routes.
 *
 * Note: This file should not import from server modules (cms-client, and
 * others), to avoid bundling server code in client bundles.
 */

import type {
  Page,
  Meditation,
  Lecture,
  WebConfig,
  MeditationSong,
} from '../../../server/cms-types'

export type CollectionType = 'pages' | 'meditations' | 'lectures'

/**
 * Base preview data (without settings). Used by the embed route.
 *
 * Note: lectures carry the raw `Lecture`, not a normalized
 * ResolvedLecture. LecturePreview normalizes it client-side after each
 * live-preview update.
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
    }
  | {
      collection: 'lectures'
      initialData: Lecture
      locale: string
    }

/**
 * Full preview data, with settings. Used by the chromed /preview route (LayoutChrome).
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
    }
  | {
      collection: 'lectures'
      initialData: Lecture
      locale: string
      settings: WebConfig
    }

// Re-export types for convenience
export type { Page, Meditation, Lecture, WebConfig, MeditationSong }
