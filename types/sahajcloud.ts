/**
 * Application-specific type definitions for SahajCloud content.
 *
 * These types give the application a stable API, independent of the
 * auto-generated PayloadCMS types. They add app-specific conveniences,
 * like the Locale type and list-item types.
 */

import type {
  Config,
  Event,
  Form,
  Page,
  Meditation,
  Song,
  Image,
  Author,
  Video,
  SongTag,
  Lecture,
  WmWebConfig,
} from './payload/payload-types'

export type { Page, Meditation, Song, Image, Author, Video, SongTag, Lecture }

/**
 * The online class a `splash` `countdown` block counts down to, as the page
 * read populates it.
 *
 * Not `Event`. The read gives this relationship four columns, so asserting the
 * whole document would let a consumer read `address` or `images` and find
 * `undefined` — the trap `NavPage` and `EmbeddedForm` below close for their own
 * reads. `SESSION_EVENT_SELECT` in
 * [sahajcloud-client.ts](sahajcloud-client.ts) is checked against
 * {@link SessionEventSelect}, so dropping a key from either is a compile error
 * in the other.
 *
 * Four, and no more: a page read is serialized into the HTML, so every column
 * selected here is shipped to every visitor of a page carrying the block.
 *
 * ⚠ **`schedule` is selected whole, never a sub-path.** `schedule.upcomingDates`
 * is a virtual field whose `afterRead` reads the stored recurrence columns and
 * declares none of them as inputs, so a narrowed sub-path select strips what it
 * reads and the schedule comes back without a single date.
 */
export type SessionEvent = Pick<Event, 'id' | 'onlineUrl' | 'eventType' | 'inactive' | 'schedule'>

/** The `select` shape that returns exactly a {@link SessionEvent}. `id` always comes back. */
export type SessionEventSelect = { [K in Exclude<keyof SessionEvent, 'id'>]: true }

/**
 * A form as an embedded relationship returns it: the fields `FormBuilder` renders
 * and submits with, and nothing else.
 *
 * Not `Form`. A narrow `select` returns none of a form's other columns — not
 * even `createdAt` — so asserting the full document would be asserting
 * something false, and would let the select and its renderer drift silently.
 * `EMBEDDED_FORM_SELECT` in [selects.ts](../server/sahajcloud/selects.ts) is checked against
 * `EmbeddedFormSelect` below, so dropping a key from either one is a compile
 * error in the other.
 */
export type EmbeddedForm = Pick<
  Form,
  | 'id'
  | 'title'
  | 'fields'
  | 'submitButtonLabel'
  | 'confirmationType'
  | 'confirmationMessage'
  | 'redirect'
  | 'actionType'
>

/** The `select` shape that returns exactly an {@link EmbeddedForm}. `id` always comes back. */
export type EmbeddedFormSelect = { [K in Exclude<keyof EmbeddedForm, 'id'>]: true }

// Re-exports the normalized Lecture view model and its pieces. This pure
// module is shared by the server fetcher and the client live preview.
// See lib/content/lecture-shape.ts.
export type {
  ResolvedLecture,
  LectureMetadata,
  LectureSubtitleTrack,
} from '@/lib/content/lecture-shape'

/**
 * A page as the site config populates it: a nav link's label and target, plus
 * the `meta` an article card draws from.
 *
 * Not `Page`. `WEB_CONFIG_POPULATE` gives these relationships four fields, so
 * asserting the full document would let `page.content` or `meta.description`
 * typecheck here and arrive `undefined` at runtime — the same bug the
 * `homePage` narrowing closed, open five fields over. `NAV_PAGE_SELECT` in
 * [selects.ts](../server/sahajcloud/selects.ts) is checked against
 * `NavPageSelect` below, so dropping a key from either one is a compile error
 * in the other.
 */
export type NavPage = Pick<Page, 'id' | 'title' | 'slug'> & {
  meta?: Pick<NonNullable<Page['meta']>, 'title' | 'image'>
}

/**
 * The `select` shape that returns exactly a {@link NavPage}. Derived from it,
 * so the two cannot drift. `id` always comes back.
 */
export type NavPageSelect = Record<Exclude<keyof NavPage, 'id' | 'meta'>, true> & {
  meta: Record<keyof NonNullable<NavPage['meta']>, true>
}

/**
 * WebConfig with populated relationships.
 *
 * These queries always use depth: 2, so every relationship field is a
 * populated object rather than a bare id — populated to the fields
 * `WEB_CONFIG_POPULATE` names, which is what makes these {@link NavPage} and
 * not `Page`.
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
   * unconfigured SahajCloud row to `['en']`. A locale prefix outside this set 404s.
   */
  availableLocales: Locale[]
  /**
   * Only the slug: `/` reads the page itself, as any slug does. `null` when the
   * configured home page is unpublished (a bare id).
   */
  homePage: Pick<Page, 'slug'> | null
  featuredPages: NavPage[]
  featuredArticles: NavPage[]
  classPages: NavPage[]
  knowledgePages: NavPage[]
  infoPages: NavPage[]
}

/**
 * Available locales extracted from PayloadCMS Config.
 *
 * Codes match PayloadCMS and the URL prefix exactly, region included and
 * cased as SahajCloud stores it (`pt-BR`, `en-AU`). A route or query that
 * lowercases the region will not resolve.
 */
export type Locale = Config['locale']

/** Page status enum */
export type PageStatus = 'draft' | 'published'

/**
 * Background-music track for a meditation, as returned by the
 * `GET /api/meditations/:id/songs` endpoint.
 *
 * That endpoint emits a fixed minimal projection: no album, artwork,
 * duration, or credit. It does the songTag and `includeForMeditations`
 * selection on the server. The player layers one of these under the
 * guided voice, and needs only a playable URL and a title. See
 * `getMeditationSongs` in server/sahajcloud/meditations.ts.
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
 * `getRelatedMeditations` in server/sahajcloud/related.ts.
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
