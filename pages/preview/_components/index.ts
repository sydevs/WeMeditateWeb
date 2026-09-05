/**
 * Shared preview components.
 *
 * Both /preview and /preview/embed routes use these components.
 *
 * Note: This file does not export PREVIEW_FETCHERS, because it imports
 * from server modules. Each +data.ts file defines its own fetcher
 * registry, to avoid bundling server code in client bundles.
 */

// Main unified component
export { Preview, type PreviewProps } from './Preview'

// Individual components (kept for flexibility)
export { PreviewBanner, type PreviewBannerProps } from './PreviewBanner'
export { PagePreview, type PagePreviewProps } from './PagePreview'
export { MeditationPreview, type MeditationPreviewProps } from './MeditationPreview'
export { LecturePreview, type LecturePreviewProps } from './LecturePreview'

// Types only (no server code)
export {
  type CollectionType,
  type BasePreviewData,
  type FullPreviewData,
  type Page,
  type Meditation,
  type Lecture,
  type WebConfig,
  type MeditationSong,
} from './types'
