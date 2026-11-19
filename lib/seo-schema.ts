/**
 * The JSON-LD a route publishes, described as plain data.
 *
 * A route's `+data.ts` says *which* nodes its document contributes and what
 * each one claims. How those nodes are spelled, linked and serialized is
 * `lib/seo-head-html.ts`, which runs on the server only. The split is what
 * keeps the generator out of `pageContext.data`: the descriptors ride the
 * document, the rendered head string never does.
 *
 * ⚠ **A field is null unless SahajCloud answered it.** The generator drops a
 * null rather than filling it, so nothing here invents a date, an author or
 * an image to satisfy a schema.
 */

/** The site's own identity, which `Organization` and `WebSite` claim. */
export interface SeoSiteIdentity {
  name: string
  description: string
  /** An absolute URL for the site's logo. */
  logo: string
  /** Profiles elsewhere on the web that are this organization's. */
  sameAs: readonly string[]
}

/** One node of a page's `@graph`, beyond `Organization` and `WebSite`. */
export type SeoNode =
  | {
      type: 'webPage'
      name: string
      description: string | null
      /** This document's own picture, never a site-wide default. */
      image: string | null
    }
  | {
      type: 'video'
      name: string
      description: string | null
      thumbnailUrl: string | null
      /** An ISO 8601 date, or null where nothing upstream recorded one. */
      uploadDate: string | null
      durationSeconds: number | null
      /** The player URL a consumer may embed, absolute. */
      embedUrl: string | null
    }

/** Everything the generator needs to build one page's linked `@graph`. */
export interface SeoSchema {
  site: SeoSiteIdentity
  /** The document's language, as a BCP 47 tag — every node carries it. */
  inLanguage: string
  nodes: readonly SeoNode[]
}
