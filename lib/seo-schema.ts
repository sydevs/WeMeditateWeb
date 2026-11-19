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

/**
 * An image as a node can describe it, rather than as a URL alone.
 *
 * The dimensions and the alt text come from the upload SahajCloud returned
 * (`IMAGE_POPULATE`), so a share card can state its own geometry and a
 * crawler reads the same words a reader would.
 */
export interface SeoImage {
  url: string
  width: number | null
  height: number | null
  alt: string | null
}

/** A rung of a breadcrumb trail. A rung that is a heading carries no URL. */
export interface SeoCrumb {
  name: string
  url: string | null
}

/** One entry of a listing page's `ItemList`, as the page server-rendered it. */
export interface SeoListEntry {
  name: string
  url: string
}

/** The byline of an article, where SahajCloud named one. */
export interface SeoAuthor {
  name: string
  /** A professional title, for example `Artist, writer and stylist`. */
  jobTitle: string | null
  description: string | null
  image: string | null
}

/** One question-and-answer pair of a page that asks and answers. */
export interface SeoQuestion {
  question: string
  answer: string
}

/** One node of a page's `@graph`, beyond `Organization` and `WebSite`. */
export type SeoNode =
  | {
      type: 'webPage'
      name: string
      description: string | null
      /** This document's own picture, never a site-wide default. */
      image: SeoImage | null
    }
  | {
      type: 'article'
      headline: string
      description: string | null
      image: SeoImage | null
      author: SeoAuthor | null
      datePublished: string | null
      dateModified: string | null
    }
  | {
      type: 'audio'
      name: string
      description: string | null
      thumbnailUrl: string | null
      durationSeconds: number | null
      /** The player URL a consumer may embed, absolute. */
      embedUrl: string | null
    }
  | {
      type: 'video'
      name: string
      description: string | null
      thumbnailUrl: string | null
      /** An ISO 8601 date, or null where nothing upstream recorded one. */
      uploadDate: string | null
      durationSeconds: number | null
      embedUrl: string | null
    }
  | { type: 'breadcrumb'; trail: readonly SeoCrumb[] }
  | { type: 'faq'; questions: readonly SeoQuestion[] }
  | { type: 'itemList'; entries: readonly SeoListEntry[] }

/** Everything the generator needs to build one page's linked `@graph`. */
export interface SeoSchema {
  site: SeoSiteIdentity
  /** The document's language, as a BCP 47 tag — every node carries it. */
  inLanguage: string
  nodes: readonly SeoNode[]
}
