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
  Video,
  SongTag,
  Lecture,
  WmWebConfig,
} from './payload-types'

// Re-export core types from PayloadCMS generated types
export type { Page, Meditation, Song, Image, Author, Video, SongTag, Lecture }

// Re-export the normalized Lecture view model and its pieces (pure, shared by
// the server fetcher and the client live-preview). See lib/lecture-shape.ts.
export type { ResolvedLecture, LectureMetadata, LectureSubtitleTrack } from '../lib/lecture-shape'

/**
 * WebConfig with populated relationships.
 *
 * Since we always use depth: 2 in our queries, all relationship fields
 * are fully populated objects, not just IDs.
 */
export interface WebConfig extends Omit<
  WmWebConfig,
  'homePage' | 'featuredPages' | 'featuredArticles' | 'classPages' | 'knowledgePages' | 'infoPages'
> {
  homePage: Page
  featuredPages: Page[]
  featuredArticles: Page[]
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

/**
 * Background-music track for a meditation, as returned by the
 * `GET /api/meditations/:id/songs` endpoint.
 *
 * That endpoint emits a fixed minimal projection (no album/artwork/duration/
 * credit) and encapsulates the songTag + `includeForMeditations` selection
 * server-side. The player layers one of these under the guided voice and needs
 * only a playable URL plus a title; see `getMeditationSongs` in cms-client.
 */
export interface MeditationSong {
  id: number
  title: string
  url: string
}

/**
 * A related meditation card, as returned by
 * `GET /api/lectures/:id/related-meditations` (SahajCloud #523).
 *
 * A *shaped* endpoint (like `/songs`): it encapsulates the node-overlap ranking
 * server-side, returns a fixed projection, and — crucially — drops any card
 * missing a public title / duration / thumbnail, so it never leaks the internal
 * admin `label`. Every field here is guaranteed present and displayable. The
 * grid is English-only in practice: meditation titles aren't localized, so the
 * endpoint returns an empty list for non-English locales (a hidden section, not
 * an error). See `getRelatedMeditations` in cms-client.
 */
export interface RelatedMeditationCard {
  id: number
  title: string
  durationMinutes: number
  thumbnailUrl: string
  narratorName: string
}

/**
 * A related lecture card, as returned by
 * `GET /api/meditations/:id/related-lectures` (the pre-existing mirror of the
 * endpoint above; requires the site's `audiences`).
 *
 * The endpoint returns the full lecture *player* projection (hls, subtitles,
 * clip window); we surface only the card-relevant subset. `durationSeconds` is
 * the playable length (clip window or full duration). See `getRelatedLectures`.
 */
export interface RelatedLectureCard {
  id: number
  title: string
  durationSeconds: number
  thumbnailUrl: string
}
