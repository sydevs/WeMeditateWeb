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
  WmWebTranslation,
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
  | 'homePage'
  | 'featuredPages'
  | 'featuredArticles'
  | 'classPages'
  | 'knowledgePages'
  | 'infoPages'
  | 'availableLocales'
> {
  /**
   * The locales the site offers, never empty: `getWebConfig` normalises an
   * unconfigured CMS row to `['en']`. A locale prefix outside this set 404s.
   */
  availableLocales: Locale[]
  homePage: Page
  featuredPages: Page[]
  featuredArticles: Page[]
  classPages: Page[]
  knowledgePages: Page[]
  infoPages: Page[]
}

/**
 * Available locales extracted from PayloadCMS Config.
 *
 * Codes match PayloadCMS and the URL prefix exactly, region included and
 * cased as the CMS stores it (`pt-BR`, `en-AU`). A route or query that
 * lowercases the region will not resolve.
 */
export type Locale = Config['locale']

/**
 * Every locale the CMS defines, as a lookup. Derived from `Locale`, so a
 * locale added upstream becomes a compile error here until it is listed.
 *
 * This is the set of codes that may appear as a URL prefix. It is not the
 * set the site offers — that is `WebConfig.availableLocales`, which an
 * editor controls per project.
 */
export const KNOWN_LOCALES: Record<Locale, true> = {
  en: true,
  es: true,
  de: true,
  it: true,
  fr: true,
  ru: true,
  ro: true,
  cs: true,
  uk: true,
  el: true,
  hy: true,
  pl: true,
  'pt-BR': true,
  fa: true,
  bg: true,
  tr: true,
  'en-AU': true,
  hu: true,
  nl: true,
}

/** Every known locale code, as an array. */
export const LOCALES = Object.keys(KNOWN_LOCALES) as Locale[]

/** Narrows an arbitrary string to a known locale code. */
export function isLocale(value: string): value is Locale {
  return Object.prototype.hasOwnProperty.call(KNOWN_LOCALES, value)
}

/** The locale every other one falls back to. Always offered. */
export const DEFAULT_LOCALE: Locale = 'en'

/** Locales that read right-to-left. Drives `<html dir>`. */
const RTL_LOCALES: ReadonlySet<string> = new Set(['fa'])

/** Text direction for a locale, for `<html dir>`. */
export function localeDirection(locale: Locale): 'ltr' | 'rtl' {
  return RTL_LOCALES.has(locale) ? 'rtl' : 'ltr'
}

/**
 * The CMS UI strings, with every group required.
 *
 * The generated `WmWebTranslation` marks each group optional, because a
 * locale may be saved partially. Every group still arrives, from Payload's
 * own locale fallback: `buildPayloadLocales` gives each non-English locale
 * `fallbackLocale: 'en'`, so a tab nobody has translated reads as English.
 * SahajCloud #705 fills a blank or missing key from English on every
 * API-client read, but only inside a group the document already carries.
 * Individual keys stay optional: a key added to the schema but not yet
 * translated anywhere is still absent, and `createT` resolves it to its
 * key path.
 */
type RequiredGroups<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends string
    ? string | undefined
    : RequiredGroups<NonNullable<T[K]>>
}

export type WebTranslations = RequiredGroups<
  Omit<WmWebTranslation, 'id' | '_status' | 'updatedAt' | 'createdAt'>
>

/** One translations tab — `common`, `navigation`, … */
export type TranslationsTab = keyof WebTranslations

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
