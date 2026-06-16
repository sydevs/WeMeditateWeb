/**
 * Shared types for preview routes
 *
 * This module provides common types used by both /preview and /preview/embed routes.
 *
 * NOTE: This file should NOT import from server modules (cms-client, etc.)
 * to avoid bundling server code in client bundles.
 */

import type { Page, Meditation, Lecture, WebConfig } from '../../../server/cms-types'

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
      locale: string
    }
  | {
      collection: 'lectures'
      initialData: Lecture
      locale: string
    }

/**
 * Full preview data with settings - used by default route (LayoutDefault)
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
export type { Page, Meditation, Lecture, WebConfig }
