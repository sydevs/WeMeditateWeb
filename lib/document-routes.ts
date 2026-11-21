/**
 * Single source of truth for the web app's document routes, in both directions:
 * - building a path from a collection and a document ({@link documentHref}), and
 * - matching an incoming URL back to its route params ({@link matchDocumentRoute}).
 *
 * `documentHref` is used by the RichText renderer (internal links and inline
 * relationship nodes), and reused by the `showcase` and `content-index`
 * blocks. `matchDocumentRoute` is used by the meditation and lecture
 * `+route.ts` files. Keeping the mapping in one place means a new route
 * (for example, lectures, albums) gets wired up by editing a single
 * table, instead of hunting through converters.
 *
 * A collection with no public web route (forms, app-cards), or a
 * document that lacks the field needed to build a link (an unpublished
 * page returns as a bare id with no slug), returns `null`. Callers
 * degrade gracefully: they render the link text unwrapped, instead of
 * emitting a dead `/undefined`.
 *
 * A `forms` reference never becomes a path, and it is not a degraded link
 * either: RichText renders the form inline through `FormBuilder`, which is why
 * that reference is handled before this mapper is consulted.
 */

import { isPopulated } from './payload-relationships'

/** PayloadCMS collection slugs that can be referenced from rich text. */
export type RelationTo = 'pages' | 'meditations' | 'lectures' | 'albums' | 'app-cards' | 'forms'

/**
 * A SahajCloud relationship value, which may be a fully populated document or a bare
 * id (number/string) depending on the read depth and publish state.
 */
export type RelationValue = number | string | { id?: number | string; slug?: string | null }

/** Extract a document id from a relationship value (populated object or bare id). */
export function refId(value: RelationValue | null | undefined): string | null {
  if (typeof value === 'number' || typeof value === 'string') {
    return String(value)
  }
  if (isPopulated(value) && value.id != null) {
    return String(value.id)
  }

  return null
}

/** Extract a non-empty slug from a populated relationship value. */
export function refSlug(value: RelationValue | null | undefined): string | null {
  if (isPopulated(value) && typeof value.slug === 'string' && value.slug.length > 0) {
    return value.slug
  }

  return null
}

/**
 * Route builders keyed by collection. A builder returns `null` when it cannot
 * produce a valid path (missing slug/id, or no public route for the collection).
 */
const ROUTE_BUILDERS: Record<
  RelationTo,
  (ref: { id: string | null; slug: string | null }) => string | null
> = {
  pages: ({ slug }) => (slug ? `/${slug}` : null),
  meditations: ({ id }) => (id ? `/meditations/${id}` : null),
  // Lectures route by id, mirroring meditations (route: pages/lectures/[id]/(full)/).
  lectures: ({ id }) => (id ? `/lectures/${id}` : null),
  // No public web route yet.
  albums: () => null,
  // App-only / embedded content with no standalone web route.
  'app-cards': () => null,
  // A form is rendered where it is embedded, never linked to.
  forms: () => null,
}

/**
 * Resolves a SahajCloud collection and document reference to a web path.
 *
 * @param relationTo - The collection slug (e.g. `pages`, `meditations`)
 * @param value - The relationship value (populated document or bare id)
 * @returns The web path, or `null` if the collection has no public route,
 *   or the reference cannot resolve to a valid link.
 */
export function documentHref(
  relationTo: string,
  value: RelationValue | null | undefined,
): string | null {
  const builder = ROUTE_BUILDERS[relationTo as RelationTo]

  if (!builder) {
    return null
  }

  return builder({ id: refId(value), slug: refSlug(value) })
}

/**
 * The collections whose documents have an embed route beside the full one.
 *
 * ⚠ `matchDocumentRoute(..., { embed: true })` is the inverse: a collection
 * listed here with no `embed/` route under `pages/` advertises a player that 404s.
 */
export const EMBEDDABLE_COLLECTIONS = ['meditations', 'lectures'] as const

export type EmbeddableCollection = (typeof EMBEDDABLE_COLLECTIONS)[number]

/**
 * The embed route for a document: the one owner of the `/embed` suffix, which
 * the paste-ready snippet, `og:video` and `/oembed` all read.
 */
export function documentEmbedHref(
  collection: EmbeddableCollection,
  value: RelationValue | null | undefined,
): string | null {
  const href = documentHref(collection, value)

  return href && `${href}/embed`
}

/**
 * Matches an incoming URL path against a collection's document route, and
 * returns the Vike route params (`{ id }`), or `false`. The matching
 * inverse of {@link documentHref} for the full and embed routes, so the path
 * shapes live in one tested place:
 *
 * - full:  `/meditations/:id`
 * - embed: `/meditations/:id/embed`
 *
 * The id is a single path segment (`[^/]+`), so the full matcher never
 * swallows the embed route, and the embed matcher requires the trailing
 * `/embed`.
 *
 * ⚠ No locale prefix: Vike hands a route the path `+onBeforeRoute` left after
 * stripping a real one, so a prefix that still reaches here is not a locale.
 * Tolerating one would serve `/zz/meditations/105` as a second address of the page.
 */
export function matchDocumentRoute(
  collection: string,
  urlPathname: string,
  options: { embed?: boolean } = {},
): { routeParams: { id: string } } | false {
  const match = urlPathname.match(documentRoutePattern(collection, options.embed ?? false))

  return match ? { routeParams: { id: match[1] } } : false
}

// Vike calls every +route.ts on each request, so build each route regex once
// (keyed by `collection[/embed]`) rather than on every match attempt. The key
// space is the fixed set of document collections × {full, embed}.
const DOCUMENT_ROUTE_PATTERNS = new Map<string, RegExp>()

function documentRoutePattern(collection: string, embed: boolean): RegExp {
  const suffix = embed ? '/embed' : ''
  const key = `${collection}${suffix}`
  let pattern = DOCUMENT_ROUTE_PATTERNS.get(key)

  if (!pattern) {
    pattern = new RegExp(`^/${collection}/([^/]+)${suffix}/?$`)
    DOCUMENT_ROUTE_PATTERNS.set(key, pattern)
  }

  return pattern
}
