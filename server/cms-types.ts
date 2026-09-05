/**
 * Application-specific type definitions for CMS content.
 *
 * These types give the application a stable API, independent of the
 * auto-generated PayloadCMS types. They add app-specific conveniences,
 * like the Locale type and list-item types.
 */

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

export type { Page, Meditation, Song, Image, Author, Video, SongTag, Lecture }

// Re-exports the normalized Lecture view model and its pieces. This pure
// module is shared by the server fetcher and the client live preview.
// See lib/lecture-shape.ts.
export type { ResolvedLecture, LectureMetadata, LectureSubtitleTrack } from '../lib/lecture-shape'

/**
 * WebConfig with populated relationships.
 *
 * These queries always use depth: 2, so every relationship field is a
 * fully populated object, not just an ID.
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
 * Simplified page reference, used in WebConfig navigation.
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
 * Minimal page data for lists (id, title, and meta image).
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
 * That endpoint emits a fixed minimal projection: no album, artwork,
 * duration, or credit. It does the songTag and `includeForMeditations`
 * selection on the server. The player layers one of these under the
 * guided voice, and needs only a playable URL and a title. See
 * `getMeditationSongs` in cms-client.
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
 * A shaped endpoint, like `/songs`. It does the node-overlap ranking on
 * the server, and returns a fixed projection. It also drops any card
 * missing a public title, duration, or thumbnail, so the internal admin
 * `label` never leaks. Every field here is guaranteed present and
 * displayable. The grid is English-only in practice: meditation titles
 * are not localized, so the endpoint returns an empty list for a
 * non-English locale (a hidden section, not an error). See
 * `getRelatedMeditations` in cms-client.
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
 * `GET /api/meditations/:id/related-lectures` (the mirror of the endpoint
 * above, requiring the site's `audiences`).
 *
 * The endpoint returns the full lecture player projection (HLS,
 * subtitles, clip window). This type surfaces only the card-relevant
 * subset. `durationSeconds` is the playable length: the clip window, or
 * the full duration. See `getRelatedLectures`.
 */
export interface RelatedLectureCard {
  id: number
  title: string
  durationSeconds: number
  thumbnailUrl: string
}
