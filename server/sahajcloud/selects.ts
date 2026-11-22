import type {
  PagesSelect,
  MeditationsSelect,
  LecturesSelect,
  AlbumsSelect,
  AppCardsSelect,
  FormsSelect,
  ImagesSelect,
  AuthorsSelect,
  VideosSelect,
  WmWebConfigSelect,
} from '@/types/payload/payload-types'
import type { EmbeddedFormSelect, NavPageSelect } from '@/types/sahajcloud'

// ============================================================================
// Field selection (required by the SahajCloud API query-validation hook)
//
// The backend rejects a read that omits `select`. It also rejects depth > 1
// without `populate`. Each query below selects only the fields the frontend
// renders. Each select constant is typed against a generated *Select
// interface. This turns a SahajCloud schema change (pulled by `pnpm types:cms`)
// into a compile error here, instead of a silent 400 or a missing field at
// runtime.
//
// Upload note: to select an upload's `url`, also select `filename`.
// Otherwise PayloadCMS returns `url: null`.
// ============================================================================

/** Image fields needed wherever an Image relationship/upload is populated. */
export const IMAGE_POPULATE = {
  images: {
    url: true,
    filename: true,
    alt: true,
    width: true,
    height: true,
  } satisfies ImagesSelect<true>,
}

/** Fields rendered for a full Page (PageTemplate): body, author byline,
 * featured video, SEO meta, plus slug/draft status. `tags` is read by the
 * head, not the body: an author or a tag is what makes a page an article
 * rather than a standing page (lib/seo/content-seo.ts). */
export const PAGE_SELECT = {
  title: true,
  content: true,
  slug: true,
  createdAt: true,
  // `dateModified` on an article, beside `datePublished` from `createdAt`.
  updatedAt: true,
  _status: true,
  author: true,
  featuredVideo: true,
  tags: true,
  meta: { title: true, description: true, image: true },
} satisfies PagesSelect<true>

/**
 * The one field the `hreflang` read needs.
 *
 * Read with `locale: 'all'`, so `_status` comes back as a per-locale map
 * rather than one locale's value. `pages` opts into
 * `versions.drafts.localizeStatus` upstream (SahajCloud#718), which is what
 * makes that map exist.
 */
export const PAGE_STATUS_SELECT = { _status: true } satisfies PagesSelect<true>

/** Author fields the byline renders (photo populates via `images` at depth 2). */
const AUTHOR_POPULATE = {
  name: true,
  title: true,
  // The `Person` node an article's byline publishes.
  description: true,
  slug: true,
  countryCode: true,
  yearsMeditating: true,
  photo: true,
} satisfies AuthorsSelect<true>

/** Video fields the VideoPlayer renders (thumbnail populates via `images`). */
const VIDEO_POPULATE = {
  hlsUrl: true,
  previewUrl: true,
  title: true,
  thumbnail: true,
  subtitles: true,
} satisfies VideosSelect<true>

/** Narrow page fields for pages embedded in another page's content. */
const EMBEDDED_PAGE_SELECT = {
  title: true,
  slug: true,
  meta: { image: true, description: true },
} satisfies PagesSelect<true>

/** Narrow meditation fields for showcase / content-index cards. */
const EMBEDDED_MEDITATION_SELECT = {
  title: true,
  thumbnail: true,
  durationMinutes: true,
} satisfies MeditationsSelect<true>

/** Narrow lecture fields. No public web route exists yet. Selected only to limit payload size. */
const EMBEDDED_LECTURE_SELECT = {
  title: true,
  thumbnail: true,
} satisfies LecturesSelect<true>

/** Narrow album fields for showcase cards (artwork thumbnail). */
const EMBEDDED_ALBUM_SELECT = {
  title: true,
  artwork: true,
} satisfies AlbumsSelect<true>

/** Minimal app-card fields. No public web route exists. Selected only to limit payload size. */
const EMBEDDED_APP_CARD_SELECT = {
  label: true,
} satisfies AppCardsSelect<true>

/**
 * A form embedded in page content, as `FormBuilder` renders and submits it.
 *
 * ⚠ **Narrow on purpose, not for payload size.** A collection absent from
 * `populate` comes back fully populated, and a form's `recipient` is a
 * relationship to `managers` — so omitting this entry serializes a manager's
 * record into the page's hydration payload. `actionType` is what the
 * submission's `type` comes from; who a message is delivered to is SahajCloud's
 * business and never the browser's.
 *
 * `EmbeddedFormSelect` is what ties this list to the `EmbeddedForm` type its
 * consumers read, so neither can lose a key without the other failing to
 * compile.
 */
const EMBEDDED_FORM_SELECT = {
  title: true,
  fields: true,
  submitButtonLabel: true,
  confirmationType: true,
  confirmationMessage: true,
  redirect: true,
  actionType: true,
} satisfies FormsSelect<true> & EmbeddedFormSelect

/**
 * Populate map for a full Page read (depth 3). The backend rejects a
 * depth > 1 read without `populate`. Each entry both enables a relationship
 * to populate and restricts it to the fields the frontend renders. Beyond
 * the author and video byline, this covers the collections referenced from
 * `content` blocks (showcase, subtle-system, image galleries), so they
 * resolve titles, slugs, and thumbnails instead of degrading.
 */
export const PAGE_POPULATE = {
  images: IMAGE_POPULATE.images,
  authors: AUTHOR_POPULATE,
  videos: VIDEO_POPULATE,
  pages: EMBEDDED_PAGE_SELECT,
  meditations: EMBEDDED_MEDITATION_SELECT,
  lectures: EMBEDDED_LECTURE_SELECT,
  albums: EMBEDDED_ALBUM_SELECT,
  'app-cards': EMBEDDED_APP_CARD_SELECT,
  forms: EMBEDDED_FORM_SELECT,
}

/** Global config fields: the `pages` relationships the layout needs, `homePage`
 * (whose slug `/` reads), and `audiences` (the site's fixed audience set the
 * lectures /for-audience feed uses). */
export const WEB_CONFIG_SELECT = {
  availableLocales: true,
  homePage: true,
  featuredPages: true,
  featuredArticles: true,
  classPages: true,
  knowledgePages: true,
  infoPages: true,
  audiences: true,
} satisfies WmWebConfigSelect<true>

/**
 * The fields a config page relationship comes back with. Annotated with
 * `NavPageSelect`, so this and the `NavPage` type it returns cannot drift:
 * adding a key here without widening `NavPage` is a compile error, and so is
 * dropping one a consumer still reads.
 */
export const NAV_PAGE_SELECT: NavPageSelect = {
  title: true,
  slug: true,
  meta: { title: true, image: true },
} satisfies PagesSelect<true>

/**
 * Populates the global's page relationships at depth 2, with only what the nav
 * renders: title and slug for a link, `meta` for a header card's image. The
 * config is serialised into every page's HTML, so nothing more belongs here.
 * Required because the backend rejects a depth > 1 read without `populate`.
 */
export const WEB_CONFIG_POPULATE = {
  images: IMAGE_POPULATE.images,
  pages: NAV_PAGE_SELECT,
}

/** Fields rendered for a Meditation (MeditationTemplate) plus draft status. */
export const MEDITATION_SELECT = {
  url: true,
  filename: true,
  title: true,
  durationMinutes: true,
  frames: true,
  thumbnail: true,
  _status: true,
} satisfies MeditationsSelect<true>

/**
 * Fields for a Lecture. `fullLecture` is selected so a clip can reach its
 * parent's `metadata`, the playback source. See LECTURE_POPULATE.
 */
export const LECTURE_SELECT = {
  type: true,
  title: true,
  thumbnail: true,
  startTime: true,
  stopTime: true,
  subtitles: true,
  metadata: true,
  fullLecture: true,
} satisfies LecturesSelect<true>

/**
 * Populate map for a Lecture read at depth 2. `lectures: LECTURE_SELECT`
 * self-populates a clip's `fullLecture` relationship with the parent's
 * fields, most importantly `metadata`. This lets a clip resolve its HLS
 * URL, duration, and base subtitles. `images` populates the thumbnail
 * upload.
 */
export const LECTURE_POPULATE = {
  images: IMAGE_POPULATE.images,
  lectures: LECTURE_SELECT,
}
