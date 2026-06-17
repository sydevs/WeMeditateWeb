/**
 * Single source of truth for the web app's document routes, in both directions:
 * - building a path from a collection + document ({@link cmsHref}), and
 * - matching an incoming URL back to its route params ({@link matchDocumentRoute}).
 *
 * `cmsHref` is used by the RichText renderer (internal links + inline relationship
 * nodes) and reused by the `showcase` block in Ticket 2. `matchDocumentRoute` is
 * used by the meditation/lecture `+route.ts` files. Keeping the mapping in one
 * place means new routes (e.g. lectures, albums) are wired up by editing a single
 * table rather than hunting through converters.
 *
 * Collections without a public web route (forms, app-cards) — or documents that
 * lack the field needed to build a link (an unpublished page comes back as a
 * bare id with no slug) — return `null`. Callers degrade gracefully: render the
 * link text unwrapped instead of emitting a dead `/undefined`.
 */

import { isPopulated } from './cms-relationships'

/** PayloadCMS collection slugs that can be referenced from rich text. */
export type RelationTo = 'pages' | 'meditations' | 'lectures' | 'albums' | 'app-cards' | 'forms'

/**
 * A CMS relationship value, which may be a fully populated document or a bare
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
  // No public web route yet — added in later tickets (lectures: Ticket 3).
  lectures: () => null,
  albums: () => null,
  // App-only / embedded content with no standalone web route.
  'app-cards': () => null,
  forms: () => null,
}

/**
 * Resolve a CMS collection + document reference to a web path.
 *
 * @param relationTo - The collection slug (e.g. `pages`, `meditations`)
 * @param value - The relationship value (populated document or bare id)
 * @returns The web path, or `null` if the collection has no public route or the
 *   reference can't be resolved to a valid link.
 */
export function cmsHref(
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
 * Match an incoming URL path against a collection's document route, returning the
 * Vike route params (`{ id }`) or `false`. The matching inverse of {@link cmsHref}
 * for the full and embed routes, so the path shapes live in one tested place:
 *
 * - full:  `/meditations/:id`        (+ optional `/:locale` prefix)
 * - embed: `/meditations/:id/embed`  (+ optional `/:locale` prefix)
 *
 * The id is a single path segment (`[^/]+`), so the full matcher never swallows
 * the embed route, and the embed matcher requires the trailing `/embed`.
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
    pattern = new RegExp(`^(?:/[a-z]{2})?/${collection}/([^/]+)${suffix}/?$`)
    DOCUMENT_ROUTE_PATTERNS.set(key, pattern)
  }

  return pattern
}
