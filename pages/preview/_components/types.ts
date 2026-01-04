/**
 * Shared types for preview routes
 *
 * This module provides common types used by both /preview and /preview/embed routes.
 *
 * NOTE: This file should NOT import from server modules (cms-client, etc.)
 * to avoid bundling server code in client bundles.
 */

import type { Page, Meditation, WeMeditateWebSettings } from '../../../server/cms-types'

export type CollectionType = 'pages' | 'meditations'

/**
 * Base preview data (without settings) - used by embed route
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

/**
 * Full preview data with settings - used by default route (LayoutDefault)
 */
export type FullPreviewData =
  | {
      collection: 'pages'
      initialData: Page
      locale: string
      settings: WeMeditateWebSettings
    }
  | {
      collection: 'meditations'
      initialData: Meditation
      locale: string
      settings: WeMeditateWebSettings
    }

// Re-export types for convenience
export type { Page, Meditation, WeMeditateWebSettings }
