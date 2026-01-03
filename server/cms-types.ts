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
  Music,
  Image,
  Author,
  PageTag,
  MeditationTag,
  MusicTag,
  WeMeditateWebSetting,
} from './payload-types'

// Re-export core types from PayloadCMS generated types
export type { Page, Meditation, Music, Image, Author, PageTag, MeditationTag, MusicTag }

/**
 * WeMeditateWebSettings with populated relationships.
 *
 * Since we always use depth: 2 in our queries, all relationship fields
 * are fully populated objects, not just IDs.
 */
export interface WeMeditateWebSettings extends Omit<WeMeditateWebSetting,
  | 'homePage' | 'featuredPages' | 'footerPages' | 'musicPage' | 'musicPageTags'
  | 'subtleSystemPage' | 'left' | 'right' | 'center'
  | 'mooladhara' | 'kundalini' | 'swadhistan' | 'nabhi' | 'void'
  | 'anahat' | 'vishuddhi' | 'agnya' | 'sahasrara'
  | 'techniquesPage' | 'techniquePageTag' | 'inspirationPage' | 'inspirationPageTags'
  | 'classesPage' | 'liveMeditationsPage'
> {
  homePage: Page
  featuredPages: Page[]
  footerPages: Page[]
  musicPage: Page
  musicPageTags: MusicTag[]
  subtleSystemPage: Page
  left: Page
  right: Page
  center: Page
  mooladhara: Page
  kundalini: Page
  swadhistan: Page
  nabhi: Page
  void: Page
  anahat: Page
  vishuddhi: Page
  agnya: Page
  sahasrara: Page
  techniquesPage: Page
  techniquePageTag: PageTag
  inspirationPage: Page
  inspirationPageTags: PageTag[]
  classesPage: Page
  liveMeditationsPage: Page
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
