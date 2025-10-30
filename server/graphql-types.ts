/**
 * Type definitions for PayloadCMS GraphQL API
 */

/**
 * Available locales in the PayloadCMS system
 */
export type Locale =
  | 'en' | 'es' | 'de' | 'it' | 'fr' | 'ru'
  | 'ro' | 'cs' | 'uk' | 'el' | 'hy' | 'pl'
  | 'pt_br' | 'fa' | 'bg' | 'tr'

/**
 * Page status enum
 */
export type PageStatus = 'draft' | 'published'

/**
 * Media image data
 */
export interface MediaImage {
  id: string
  url: string | null
  thumbnailURL: string | null
  alt: string | null
  credit: string | null
  filename: string | null
  mimeType: string | null
  width: number | null
  height: number | null
  focalX: number | null
  focalY: number | null
  sizes: {
    thumbnail?: {
      url: string | null
      width: number | null
      height: number | null
      mimeType: string | null
      filename: string | null
    }
    card?: {
      url: string | null
      width: number | null
      height: number | null
      mimeType: string | null
      filename: string | null
    }
    tablet?: {
      url: string | null
      width: number | null
      height: number | null
      mimeType: string | null
      filename: string | null
    }
  } | null
}

/**
 * Page meta information
 */
export interface PageMeta {
  title: string | null
  description: string | null
  image: MediaImage | null
}

/**
 * Author information
 */
export interface Author {
  id: string
  name: string | null
  title: string | null
  description: string | null
  countryCode: string | null
  yearsMeditating: number | null
  image: MediaImage | null
}

/**
 * Page tag
 */
export interface PageTag {
  id: string
  name: string
  title: string | null
}

/**
 * Full page data structure
 */
export interface Page {
  id: string
  title: string | null
  content: any | null // JSON content
  meta: PageMeta | null
  slug: string | null
  publishAt: string | null // DateTime
  author: Author | null
  tags: PageTag[] | null
  _status: PageStatus | null
}

/**
 * Simplified page reference (used in WeMeditateWebSettings)
 */
export interface PageReference {
  id: string
  title: string | null
  slug: string | null
}

/**
 * WeMeditate web settings structure
 */
export interface WeMeditateWebSettings {
  homePage: PageReference
  featuredPages: PageReference[]
  footerPages: PageReference[]
  musicPage: PageReference
  musicPageTags: PageReference[]
  subtleSystemPage: PageReference
  left: PageReference
  right: PageReference
  center: PageReference
  mooladhara: PageReference
  kundalini: PageReference
  swadhistan: PageReference
  nabhi: PageReference
  void: PageReference
  anahat: PageReference
  vishuddhi: PageReference
  agnya: PageReference
  sahasrara: PageReference
  techniquesPage: PageReference
  techniquePageTag: PageTag
  inspirationPage: PageReference
  inspirationPageTags: PageReference[]
  classesPage: PageReference
  liveMeditationsPage: PageReference
}

/**
 * Meditation tag
 */
export interface MeditationTag {
  id: string
  name: string
  title: string | null
}

/**
 * Music tag
 */
export interface MusicTag {
  id: string
  name: string
  title: string | null
}

/**
 * Full meditation data structure
 */
export interface Meditation {
  id: string
  label: string
  locale: Locale
  musicTag: MusicTag | null
  fileMetadata: any | null // JSON
  publishAt: string | null // DateTime
  title: string | null
  slug: string | null
  thumbnail: MediaImage | null
  tags: MeditationTag[] | null
  frames: any | null // JSON
  url: string | null
  thumbnailURL: string | null
  filename: string | null
  mimeType: string | null
}

/**
 * Full music data structure
 */
export interface Music {
  id: string
  title: string | null
  slug: string | null
  tags: MusicTag[] | null
  credit: string | null
  fileMetadata: any | null // JSON
  url: string | null
  filename: string | null
  mimeType: string | null
}

/**
 * Minimal page data for lists (id, title, thumbnail)
 */
export interface PageListItem {
  id: string
  title: string | null
  meta: {
    image: MediaImage | null
  } | null
}

/**
 * Minimal meditation data for lists (id, title, thumbnail)
 */
export interface MeditationListItem {
  id: string
  title: string | null
  thumbnail: MediaImage | null
}
