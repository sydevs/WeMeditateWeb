/**
 * Application-specific type definitions for CMS content.
 *
 * These types provide a stable API for the application, independent of
 * the auto-generated PayloadCMS types. They include app-specific
 * conveniences like Locale type and list item types.
 */

// Import base types for extending
import type {
  Config,
  Page,
  Meditation,
  Song,
  Image,
  Author,
  MeditationTag,
  SongTag,
  WmWebConfig,
} from './payload-types'

// Re-export core types from PayloadCMS generated types
export type { Page, Meditation, Song, Image, Author, MeditationTag, SongTag }

/**
 * WebConfig with populated relationships.
 *
 * Since we always use depth: 2 in our queries, all relationship fields
 * are fully populated objects, not just IDs.
 */
export interface WebConfig extends Omit<WmWebConfig,
  | 'homePage' | 'featuredPages' | 'classPages' | 'knowledgePages' | 'infoPages'
> {
  homePage: Page
  featuredPages: Page[]
  classPages: Page[]
  knowledgePages: Page[]
  infoPages: Page[]
}

/**
 * Available locales extracted from PayloadCMS Config.
 * Uses hyphen format (e.g., 'pt-br') matching PayloadCMS and URL patterns.
 */
export type Locale = Config['locale']

/**
 * Page status enum
 */
export type PageStatus = 'draft' | 'published'

/**
 * Simplified page reference (used in WeMeditateWebSettings navigation)
 */
export interface PageReference {
  id: string | number
  title: string
  slug: string
}

/**
 * Page meta information
 */
export interface PageMeta {
  title: string | null
  description: string | null
  image: import('./payload-types').Image | null
}

/**
 * Minimal page data for lists (id, title, thumbnail)
 */
export interface PageListItem {
  id: string | number
  title: string | null
  meta: {
    image: import('./payload-types').Image | null
  } | null
}

/**
 * Minimal meditation data for lists (id, title, thumbnail)
 */
export interface MeditationListItem {
  id: string | number
  title: string | null
  thumbnail: import('./payload-types').Image | null
}
