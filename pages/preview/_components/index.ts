/**
 * Shared preview components
 *
 * These components are used by both /preview and /preview/embed routes.
 *
 * NOTE: PREVIEW_FETCHERS is intentionally NOT exported here because it imports
 * from server modules. Each +data.ts file defines its own fetcher registry
 * to avoid bundling server code in client bundles.
 */

// Main unified component
export { Preview, type PreviewProps } from './Preview'

// Individual components (kept for flexibility)
export { PreviewBanner, type PreviewBannerProps } from './PreviewBanner'
export { PagePreview, type PagePreviewProps } from './PagePreview'
export { MeditationPreview, type MeditationPreviewProps } from './MeditationPreview'

// Types only (no server code)
export {
  type CollectionType,
  type BasePreviewData,
  type FullPreviewData,
  type Page,
  type Meditation,
  type WeMeditateWebSettings,
} from './types'
