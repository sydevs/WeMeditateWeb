/**
 * The JSON-LD a route publishes, described as plain data.
 *
 * ⚠ **Descriptors, not Unhead's `define*` output**, because those carry a
 * `_resolver` holding functions, and this rides `pageContext.data`.
 * `lib/seo/head-html.ts` turns each descriptor into its node on the server.
 *
 * A field is absent unless SahajCloud answered it: nothing here invents a
 * date, an author or an image to satisfy a schema.
 */

/** The site's own identity, which `Organization` and `WebSite` claim. */
export interface SeoSiteIdentity {
  name: string
  description: string
  /** An absolute URL for the site's logo. */
  logo: string
  sameAs: readonly string[]
}

/** An image with its words and, where known, its geometry — Unhead's `ogImage` shape. */
export interface SeoImage {
  url: string
  width?: number
  height?: number
  alt?: string
}

export interface SeoAuthor {
  name: string
  /** A professional title, for example `Artist, writer and stylist`. */
  jobTitle?: string
  description?: string
  image?: string
}

/** One recording of a page's music library. The artist is the album's. */
export interface SeoTrack {
  name: string
  artist?: string
  /** Absolute, and already through `isSafeHttpUrl`. */
  artistUrl?: string
  durationSeconds?: number
}

/** One node of a page's `@graph`, beyond `Organization` and `WebSite`. */
export type SeoNode =
  | { type: 'webPage'; name: string; description?: string; image?: SeoImage }
  | {
      type: 'article'
      headline: string
      description?: string
      image?: SeoImage
      author?: SeoAuthor
      datePublished?: string
      dateModified?: string
    }
  | {
      type: 'audio' | 'video'
      name: string
      description?: string
      thumbnailUrl?: string
      durationSeconds?: number
      /** The absolute player URL a consumer may embed. */
      embedUrl?: string
    }
  | { type: 'breadcrumb'; trail: readonly { name: string; url: string }[] }
  | { type: 'itemList'; entries: readonly { name: string; url: string }[] }
  | { type: 'musicPlaylist'; name: string; tracks: readonly SeoTrack[] }

/** Everything the generator needs to build one page's linked `@graph`. */
export interface SeoSchema {
  site: SeoSiteIdentity
  /** The document's language, as a BCP 47 tag. */
  inLanguage: string
  nodes: readonly SeoNode[]
}
